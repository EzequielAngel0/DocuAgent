# 🏗️ Infraestructura OCI (Terraform)

Provisiona, de forma reproducible, lo necesario para correr DocuAgent (y otros
proyectos de portafolio) en OCI:

- **Red COMPARTIDA** (una vez): VCN, **subred privada**, **NAT Gateway** (salida a
  internet), Service Gateway, route table y security list.
- **Instancias privadas** (una por proyecto, `var.projects`): **sin IP pública**.
- **OCI Bastion** para entrar por SSH a las instancias privadas.

> Diseño: las instancias **no exponen puertos públicos**. La entrada de tráfico
> de la app la da el **túnel de Cloudflare** (conexión *saliente* desde la VM).
> La salida a internet (pull de imágenes, Cohere/Gemini, túnel) va por el **NAT**.
> El acceso administrativo va por el **Bastion** (no necesitas IP pública).

## Requisitos

- Terraform ≥ 1.5 y un par de llaves de API de OCI (`~/.oci/config`).
- Una llave SSH (`~/.ssh/id_ed25519`).

## Uso

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars   # rellena tus OCIDs, IP y SSH key
terraform init
terraform plan
terraform apply
```

`terraform output instances` te da la **IP privada** y el OCID de cada instancia.

## Entrar por SSH (sin IP pública, vía Bastion)

```bash
# 1) Abre una sesión SSH gestionada al instance:
oci bastion session create-managed-ssh \
  --bastion-id <bastion_id> \
  --target-resource-id <instance_ocid> \
  --target-os-username ubuntu \
  --ssh-public-key-file ~/.ssh/id_ed25519.pub \
  --session-ttl 3600

# 2) `oci bastion session get --session-id <id>` te imprime el comando SSH
#    completo (con ProxyCommand al host del bastion). Cópialo y conéctate.
```

(En la consola de OCI, "Bastion → Sessions" también te da el comando listo.)

## Desplegar la app en la VM

Una vez dentro (cloud-init ya instaló `podman` + `podman-compose` + `git`):

```bash
git clone <repo> docuagent && cd docuagent
cp .env.example .env.prod      # y rellénalo (túnel de PROD, claves, COOKIE_DOMAIN, etc.)
./ops/docuagent.sh up          # build local + levantar (incluye cloudflared)
```

El `cloudflared` del compose levanta el **túnel de producción** (con su token en
`.env.prod`) y publica `docuagent.*` / `api-docuagent.*` apuntando a esta VM.

## Añadir más proyectos (otras instancias)

La red (VCN/subred/NAT/Bastion) es **compartida**. Para un proyecto nuevo, agrega
una entrada al mapa `projects` en `terraform.tfvars` y `terraform apply`:

```hcl
projects = {
  docuagent     = { ocpus = 1, memory_gbs = 6, boot_gbs = 50 }
  otro-proyecto = { ocpus = 1, memory_gbs = 6, boot_gbs = 50 }
}
```

Crea otra instancia privada en la misma red, accesible por el mismo Bastion.

## Notas

- **Shape**: por defecto `VM.Standard.A1.Flexible` (Ampere ARM, Always Free). Las
  imágenes del proyecto son multi-arch (arm64). Para x86 cambia `var.shape`.
- **Regla práctica de densidad**: un stack pesado (BD + vector store + backend
  LLM) por instancia de 1 OCPU / 6 GB. Co-loca 2 solo si el segundo es ligero.
- `terraform.tfvars` y `*.tfstate` contienen datos sensibles: **no se commitean**
  (ya están en `.gitignore`).
