# --- Autenticación / tenancy (de tu config de OCI CLI ~/.oci/config) ---
variable "tenancy_ocid" { type = string }
variable "user_ocid" { type = string }
variable "fingerprint" { type = string }
variable "private_key_path" { type = string }
variable "region" { type = string }

# Compartment donde se crean los recursos (puede ser el del tenancy raíz).
variable "compartment_ocid" { type = string }

# --- Red (compartida por TODOS los proyectos) ---
variable "name_prefix" {
  type    = string
  default = "portafolio"
}
variable "vcn_cidr" {
  type    = string
  default = "10.0.0.0/16"
}
variable "private_subnet_cidr" {
  type    = string
  default = "10.0.1.0/24"
}

# CIDRs desde los que TÚ te conectas al Bastion (tu IP pública /32, p. ej.
# "203.0.113.7/32"). Restríngelo lo más posible.
variable "bastion_client_cidrs" {
  type = list(string)
}

# --- Compute ---
# Llave SSH pública que se inyecta a las instancias (para el Bastion).
variable "ssh_public_key" { type = string }

# Ampere A1 (ARM) entra en el Always Free. Las imágenes del proyecto son
# multi-arch (arm64), así que funcionan. Para x86 usa VM.Standard.E*.Flexible.
variable "shape" {
  type    = string
  default = "VM.Standard.A1.Flexible"
}

# Mapa de proyectos → una INSTANCIA por proyecto (añade entradas para escalar).
# Cada proyecto pesado (con BD + vector store) conviene en su propia instancia.
variable "projects" {
  type = map(object({
    ocpus      = number
    memory_gbs = number
    boot_gbs   = number
  }))
  default = {
    docuagent = {
      ocpus      = 1
      memory_gbs = 6
      boot_gbs   = 50
    }
    # Para otro proyecto, descomenta y ajusta:
    # otro-proyecto = { ocpus = 1, memory_gbs = 6, boot_gbs = 50 }
  }
}
