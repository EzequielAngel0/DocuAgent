output "vcn_id" {
  value = oci_core_vcn.main.id
}

output "private_subnet_id" {
  value = oci_core_subnet.private.id
}

output "bastion_id" {
  description = "ID del Bastion (úsalo para abrir sesiones SSH a las instancias)."
  value       = oci_bastion_bastion.bastion.id
}

output "instances" {
  description = "IP privada y OCID por proyecto."
  value = {
    for k, inst in oci_core_instance.app : k => {
      private_ip  = inst.private_ip
      instance_id = inst.id
    }
  }
}
