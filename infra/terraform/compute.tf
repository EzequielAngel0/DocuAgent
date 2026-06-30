# ============================================================
# Una INSTANCIA por proyecto (for_each sobre var.projects), todas en la
# subred privada compartida, sin IP pública, con el plugin de Bastion
# habilitado para el acceso SSH gestionado.
# ============================================================

data "oci_identity_availability_domains" "ads" {
  compartment_id = var.tenancy_ocid
}

# Imagen Ubuntu 24.04 más reciente para la shape elegida (auto, sin OCID a mano).
data "oci_core_images" "ubuntu" {
  compartment_id           = var.compartment_ocid
  operating_system         = "Canonical Ubuntu"
  operating_system_version = "24.04"
  shape                    = var.shape
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"
}

resource "oci_core_instance" "app" {
  for_each = var.projects

  compartment_id      = var.compartment_ocid
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name
  display_name        = each.key
  shape               = var.shape

  shape_config {
    ocpus         = each.value.ocpus
    memory_in_gbs = each.value.memory_gbs
  }

  source_details {
    source_type             = "image"
    source_id               = data.oci_core_images.ubuntu.images[0].id
    boot_volume_size_in_gbs = each.value.boot_gbs
  }

  create_vnic_details {
    subnet_id        = oci_core_subnet.private.id
    assign_public_ip = false
    hostname_label   = each.key
  }

  metadata = {
    ssh_authorized_keys = var.ssh_public_key
    user_data           = base64encode(file("${path.module}/cloud-init.yaml"))
  }

  # Habilita el plugin de Bastion (Oracle Cloud Agent) para SSH gestionado.
  agent_config {
    are_all_plugins_disabled = false
    is_management_disabled   = false
    is_monitoring_disabled   = false
    plugins_config {
      name          = "Bastion"
      desired_state = "ENABLED"
    }
  }
}
