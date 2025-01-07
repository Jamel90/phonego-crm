# Modèle Physique de Données - PhoneGoCRM

## Tables

### users
| Champ | Type | Description | Contraintes |
|-------|------|-------------|-------------|
| id | string | Identifiant unique de l'utilisateur | PK |
| email | string | Email de l'utilisateur | UNIQUE, NOT NULL |
| role | string | Rôle de l'utilisateur (admin, user) | NOT NULL |
| createdAt | timestamp | Date de création | NOT NULL |
| updatedAt | timestamp | Date de dernière modification | NOT NULL |

### customers
| Champ | Type | Description | Contraintes |
|-------|------|-------------|-------------|
| id | string | Identifiant unique du client | PK |
| name | string | Nom du client | NOT NULL |
| phone | string | Numéro de téléphone | NOT NULL |
| email | string | Email du client | |
| address | string | Adresse du client | |
| createdAt | timestamp | Date de création | NOT NULL |
| updatedAt | timestamp | Date de dernière modification | NOT NULL |

### manufacturers
| Champ | Type | Description | Contraintes |
|-------|------|-------------|-------------|
| id | string | Identifiant unique du fabricant | PK |
| name | string | Nom du fabricant | NOT NULL |
| createdAt | timestamp | Date de création | NOT NULL |
| updatedAt | timestamp | Date de dernière modification | NOT NULL |

### repairs
| Champ | Type | Description | Contraintes |
|-------|------|-------------|-------------|
| id | string | Identifiant unique de la réparation | PK |
| userId | string | ID de l'utilisateur qui a créé la réparation | FK(users.id) |
| customerId | string | ID du client | FK(customers.id) |
| manufacturerId | string | ID du fabricant | FK(manufacturers.id) |
| deviceModel | string | Modèle de l'appareil | NOT NULL |
| description | string | Description du problème | NOT NULL |
| status | string | Statut de la réparation (nouveau, en_cours, diagnostic_termine, attente_pieces, pret_pour_reparation, termine, annule) | NOT NULL |
| priority | string | Priorité (low, normal, high, urgent) | NOT NULL |
| price | number | Prix total de la réparation | NOT NULL |
| deposit | number | Montant de l'acompte | NOT NULL |
| createdAt | timestamp | Date de création | NOT NULL |
| updatedAt | timestamp | Date de dernière modification | NOT NULL |

### parts
| Champ | Type | Description | Contraintes |
|-------|------|-------------|-------------|
| id | string | Identifiant unique de la pièce | PK |
| name | string | Nom de la pièce | NOT NULL |
| description | string | Description de la pièce | |
| price | number | Prix unitaire | NOT NULL |
| stock | number | Quantité en stock | NOT NULL |
| createdAt | timestamp | Date de création | NOT NULL |
| updatedAt | timestamp | Date de dernière modification | NOT NULL |

### repair_parts
| Champ | Type | Description | Contraintes |
|-------|------|-------------|-------------|
| id | string | Identifiant unique | PK |
| repairId | string | ID de la réparation | FK(repairs.id) |
| partId | string | ID de la pièce | FK(parts.id) |
| quantity | number | Quantité utilisée | NOT NULL |
| createdAt | timestamp | Date de création | NOT NULL |
| updatedAt | timestamp | Date de dernière modification | NOT NULL |

### notifications
| Champ | Type | Description | Contraintes |
|-------|------|-------------|-------------|
| id | string | Identifiant unique de la notification | PK |
| userId | string | ID de l'utilisateur destinataire | FK(users.id) |
| repairId | string | ID de la réparation concernée | FK(repairs.id) |
| type | string | Type de notification | NOT NULL |
| message | string | Message de la notification | NOT NULL |
| read | boolean | État de lecture | NOT NULL |
| createdAt | timestamp | Date de création | NOT NULL |
| updatedAt | timestamp | Date de dernière modification | NOT NULL |

## Relations

1. **users - repairs**
   - Un utilisateur peut avoir plusieurs réparations
   - Une réparation appartient à un seul utilisateur

2. **customers - repairs**
   - Un client peut avoir plusieurs réparations
   - Une réparation appartient à un seul client

3. **manufacturers - repairs**
   - Un fabricant peut être associé à plusieurs réparations
   - Une réparation concerne un seul fabricant

4. **repairs - parts** (via repair_parts)
   - Une réparation peut utiliser plusieurs pièces
   - Une pièce peut être utilisée dans plusieurs réparations

5. **users - notifications**
   - Un utilisateur peut avoir plusieurs notifications
   - Une notification appartient à un seul utilisateur

6. **repairs - notifications**
   - Une réparation peut avoir plusieurs notifications
   - Une notification concerne une seule réparation

## Indexes

1. **users**
   - Index sur email (UNIQUE)

2. **repairs**
   - Index sur userId
   - Index sur customerId
   - Index sur status
   - Index composé sur (userId, status)

3. **repair_parts**
   - Index composé sur (repairId, partId)

4. **notifications**
   - Index sur userId
   - Index sur repairId
   - Index sur read
   - Index composé sur (userId, read)

## Contraintes

1. **Status de réparation valides**
   - nouveau
   - en_cours
   - diagnostic_termine
   - attente_pieces
   - pret_pour_reparation
   - termine
   - annule

2. **Priorités valides**
   - low
   - normal
   - high
   - urgent

3. **Contraintes de prix**
   - price >= 0
   - deposit >= 0
   - deposit <= price

4. **Contraintes de stock**
   - stock >= 0

5. **Contraintes de quantité**
   - quantity > 0 dans repair_parts
