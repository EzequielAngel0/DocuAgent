# ============================================================
# Red COMPARTIDA por todos los proyectos (se crea una sola vez).
# Instancias SIN IP pública: salida a internet por NAT Gateway
# (para pull de imágenes, Cohere/Gemini y el túnel de Cloudflare),
# entrada por el túnel (saliente) — nada de ingress 80/443 público.
# Acceso administrativo por OCI Bastion (no hace falta IP pública).
# ============================================================

resource "oci_core_vcn" "main" {
  compartment_id = var.compartment_ocid
  cidr_blocks    = [var.vcn_cidr]
  display_name   = "${var.name_prefix}-vcn"
  dns_label      = "portafolio"
}

# Salida a internet para subredes privadas.
resource "oci_core_nat_gateway" "nat" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.main.id
  display_name   = "${var.name_prefix}-nat"
}

# Acceso privado a servicios de OCI (Object Storage, etc.) sin pasar por internet.
data "oci_core_services" "all" {}

resource "oci_core_service_gateway" "sgw" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.main.id
  display_name   = "${var.name_prefix}-sgw"
  services {
    service_id = data.oci_core_services.all.services[0].id
  }
}

resource "oci_core_route_table" "private" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.main.id
  display_name   = "${var.name_prefix}-rt-private"

  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_nat_gateway.nat.id
  }
  route_rules {
    destination       = data.oci_core_services.all.services[0].cidr_block
    destination_type  = "SERVICE_CIDR_BLOCK"
    network_entity_id = oci_core_service_gateway.sgw.id
  }
}

resource "oci_core_security_list" "private" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.main.id
  display_name   = "${var.name_prefix}-sl-private"

  # Salida abierta (necesaria para NAT: imágenes, APIs LLM, túnel).
  egress_security_rules {
    destination = "0.0.0.0/0"
    protocol    = "all"
  }

  # SSH solo desde dentro de la VCN (por aquí llega el Bastion service).
  ingress_security_rules {
    source   = var.vcn_cidr
    protocol = "6" # TCP
    tcp_options {
      min = 22
      max = 22
    }
  }
}

# Subred PRIVADA donde viven todas las instancias de apps.
resource "oci_core_subnet" "private" {
  compartment_id             = var.compartment_ocid
  vcn_id                     = oci_core_vcn.main.id
  cidr_block                 = var.private_subnet_cidr
  display_name               = "${var.name_prefix}-subnet-private"
  dns_label                  = "apps"
  prohibit_public_ip_on_vnic = true
  route_table_id             = oci_core_route_table.private.id
  security_list_ids          = [oci_core_security_list.private.id]
}

# Bastion gestionado de OCI: sesiones SSH a instancias privadas sin IP pública.
resource "oci_bastion_bastion" "bastion" {
  compartment_id               = var.compartment_ocid
  bastion_type                 = "standard"
  target_subnet_id             = oci_core_subnet.private.id
  client_cidr_block_allow_list = var.bastion_client_cidrs
  name                         = "${var.name_prefix}-bastion"
}
