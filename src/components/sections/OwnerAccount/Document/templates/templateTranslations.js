// Multi-language template translations with realistic content
export const templateTranslations = {
  en: {
    lease: {
      standard: {
        title: 'RESIDENTIAL LEASE AGREEMENT',
        parties: 'PARTIES TO THIS AGREEMENT',
        landlordSection: 'LANDLORD (Lessor)',
        tenantSection: 'TENANT (Lessee)',
        propertySection: 'PROPERTY DESCRIPTION',
        termSection: 'LEASE TERM',
        rentSection: 'RENT AND PAYMENT TERMS',
        depositSection: 'SECURITY DEPOSIT',
        utilitiesSection: 'UTILITIES AND SERVICES',
        rulesSection: 'PROPERTY RULES AND REGULATIONS',
        maintenanceSection: 'MAINTENANCE AND REPAIRS',
        terminationSection: 'TERMINATION',
        signaturesSection: 'SIGNATURES AND ACKNOWLEDGMENT',
        
        content: {
          intro: 'This Lease Agreement ("Agreement") is entered into on {{lease_start_date}}, by and between the parties identified below, for the rental of the residential property described herein.',
          
          propertyDesc: 'The Landlord hereby leases to the Tenant, and the Tenant hereby leases from the Landlord, the following described property: {{property_address}}, {{property_city}}, {{property_state}} {{property_zip}} ("Premises"), consisting of {{property_bedrooms}} bedroom(s) and {{property_bathrooms}} bathroom(s).',
          
          termText: 'The term of this lease shall commence on {{lease_start_date}} and shall terminate on {{lease_end_date}}, a period of {{lease_term_months}} months. Upon expiration, this Agreement shall automatically convert to a month-to-month tenancy unless either party provides written notice of termination at least thirty (30) days prior to the expiration date.',
          
          rentText: 'Tenant agrees to pay Landlord as base rent the sum of ${{monthly_rent}} per month, due and payable monthly in advance on the {{payment_due_day}} day of each month. The first month\'s rent of ${{first_month_rent}} is due upon execution of this Agreement.',
          
          latePayment: 'If rent is not received by the {{payment_due_day}} of the month, Tenant shall pay a late fee of ${{late_fee_amount}} after a grace period of {{late_fee_grace_period}} days. Returned check fee shall be $50.00.',
          
          depositText: 'Upon execution of this Agreement, Tenant shall deposit with Landlord the sum of ${{security_deposit}} as security for the faithful performance of Tenant\'s obligations. The deposit shall be returned within 30 days after termination, less any deductions for damages beyond normal wear and tear.',
          
          utilitiesText: 'The following utilities are included in the rent: {{utilities_included}}. Tenant shall be responsible for payment of the following utilities: {{tenant_pays}}. Tenant must maintain utilities in their name and keep current on all utility bills.',
          
          rules: [
            'No smoking is permitted anywhere on the premises',
            'Pets are {{pets_allowed}}. If allowed, additional pet deposit of ${{pet_deposit}} required',
            'Maximum occupancy is limited to {{max_occupants}} persons',
            'Quiet hours are from 10:00 PM to 8:00 AM daily',
            'No illegal activities or substances permitted on premises',
            'Tenant must maintain renters insurance with minimum $100,000 liability coverage',
            'No alterations to the property without written consent from Landlord',
            'Parking limited to designated spaces only'
          ],
          
          maintenanceText: 'Landlord shall maintain the premises in habitable condition. Tenant shall maintain the premises in clean and sanitary condition and shall immediately notify Landlord of any maintenance issues. Tenant is responsible for minor repairs under $100.',
          
          terminationText: 'Either party may terminate this lease with 30 days written notice. Early termination by Tenant will result in forfeiture of security deposit and liability for remaining rent unless a replacement tenant is found.',
          
          acknowledgment: 'By signing below, the parties acknowledge that they have read, understood, and agree to be bound by all terms and conditions of this Lease Agreement. This Agreement constitutes the entire agreement between the parties.'
        }
      }
    },
    
    notices: {
      payOrQuit: {
        title: 'THREE-DAY NOTICE TO PAY RENT OR QUIT',
        content: {
          to: 'TO: {{tenant_name}} and all other occupants',
          address: 'PROPERTY ADDRESS: {{property_address}}',
          
          body: `You are hereby notified that you are in default in payment of rent for the above-described premises. The amount owed is:

Total Rent Due: ${'$'}{{amount_owed}}
For the period(s): {{rent_months}}

You are hereby required to pay said rent in full within THREE (3) DAYS from the date of service of this notice or to vacate and surrender the above-described premises.

If you fail to pay the full amount of rent due or vacate the premises within three days, legal proceedings will be instituted against you to recover possession of the premises, unpaid rent, attorney fees, and court costs.

This notice is served upon you for the purpose of terminating your tenancy. Should you fail to comply, legal proceedings will be initiated against you.`,
          
          declaration: 'I declare under penalty of perjury that the foregoing is true and correct.',
          
          dated: 'Dated this {{notice_date}}',
          
          signature: 'Landlord/Agent: {{landlord_name}}'
        }
      }
    }
  },
  
  de: {
    lease: {
      standard: {
        title: 'WOHNRAUMMIETVERTRAG',
        parties: 'VERTRAGSPARTEIEN',
        landlordSection: 'VERMIETER',
        tenantSection: 'MIETER',
        propertySection: 'MIETOBJEKT',
        termSection: 'MIETDAUER',
        rentSection: 'MIETE UND ZAHLUNGSBEDINGUNGEN',
        depositSection: 'KAUTION',
        utilitiesSection: 'NEBENKOSTEN',
        rulesSection: 'HAUSORDNUNG',
        maintenanceSection: 'INSTANDHALTUNG UND REPARATUREN',
        terminationSection: 'KÜNDIGUNG',
        signaturesSection: 'UNTERSCHRIFTEN',
        
        content: {
          intro: 'Dieser Mietvertrag ("Vertrag") wird am {{lease_start_date}} zwischen den nachfolgend genannten Parteien für die Vermietung der hier beschriebenen Wohnimmobilie geschlossen.',
          
          propertyDesc: 'Der Vermieter vermietet hiermit an den Mieter und der Mieter mietet vom Vermieter folgende Immobilie: {{property_address}}, {{property_city}}, {{property_state}} {{property_zip}} ("Mietobjekt"), bestehend aus {{property_bedrooms}} Zimmer(n) und {{property_bathrooms}} Bad/Bädern.',
          
          termText: 'Das Mietverhältnis beginnt am {{lease_start_date}} und endet am {{lease_end_date}}, für einen Zeitraum von {{lease_term_months}} Monaten. Das Mietverhältnis kann mit einer Frist von drei Monaten zum Monatsende gekündigt werden.',
          
          rentText: 'Der Mieter verpflichtet sich, an den Vermieter eine monatliche Grundmiete von €{{monthly_rent}} zu zahlen, fällig und zahlbar monatlich im Voraus am {{payment_due_day}}. jeden Monats. Die erste Monatsmiete von €{{first_month_rent}} ist bei Vertragsunterzeichnung fällig.',
          
          latePayment: 'Bei Zahlungsverzug nach dem {{payment_due_day}}. des Monats wird nach einer Schonfrist von {{late_fee_grace_period}} Tagen eine Mahngebühr von €{{late_fee_amount}} erhoben.',
          
          depositText: 'Bei Vertragsabschluss hinterlegt der Mieter beim Vermieter eine Kaution in Höhe von €{{security_deposit}} als Sicherheit für die Erfüllung seiner Verpflichtungen. Die Kaution wird innerhalb von 30 Tagen nach Beendigung des Mietverhältnisses zurückgezahlt, abzüglich etwaiger Abzüge für Schäden.',
          
          utilitiesText: 'Folgende Nebenkosten sind in der Miete enthalten: {{utilities_included}}. Der Mieter ist für folgende Nebenkosten verantwortlich: {{tenant_pays}}.',
          
          rules: [
            'Rauchen ist in der gesamten Wohnung verboten',
            'Haustiere sind {{pets_allowed}}. Falls erlaubt, zusätzliche Kaution von €{{pet_deposit}} erforderlich',
            'Maximale Belegung ist auf {{max_occupants}} Personen begrenzt',
            'Ruhezeiten sind täglich von 22:00 bis 6:00 Uhr',
            'Keine illegalen Aktivitäten oder Substanzen auf dem Grundstück',
            'Der Mieter muss eine Haftpflichtversicherung unterhalten',
            'Keine baulichen Veränderungen ohne schriftliche Zustimmung des Vermieters',
            'Parken nur auf zugewiesenen Stellplätzen'
          ],
          
          maintenanceText: 'Der Vermieter erhält die Wohnung in bewohnbarem Zustand. Der Mieter verpflichtet sich, die Wohnung pfleglich zu behandeln und den Vermieter unverzüglich über Mängel zu informieren.',
          
          terminationText: 'Die Kündigung erfolgt gemäß den gesetzlichen Bestimmungen mit einer Frist von drei Monaten zum Monatsende.',
          
          acknowledgment: 'Mit ihrer Unterschrift bestätigen die Parteien, dass sie alle Bedingungen dieses Mietvertrags gelesen, verstanden und akzeptiert haben.'
        }
      }
    },
    
    notices: {
      payOrQuit: {
        title: 'ZAHLUNGSAUFFORDERUNG UND KÜNDIGUNGSANDROHUNG',
        content: {
          to: 'AN: {{tenant_name}} und alle anderen Bewohner',
          address: 'MIETOBJEKT: {{property_address}}',
          
          body: `Hiermit werden Sie darauf hingewiesen, dass Sie mit der Mietzahlung für das oben genannte Mietobjekt im Verzug sind.

Ausstehende Miete: €{{amount_owed}}
Für den Zeitraum: {{rent_months}}

Sie werden hiermit aufgefordert, die ausstehende Miete innerhalb von DREI (3) WERKTAGEN nach Zustellung dieser Mitteilung vollständig zu bezahlen oder die Wohnung zu räumen.

Sollten Sie der Zahlungsaufforderung nicht nachkommen, werden rechtliche Schritte eingeleitet.`,
          
          declaration: 'Ich versichere die Richtigkeit der obigen Angaben.',
          
          dated: 'Datum: {{notice_date}}',
          
          signature: 'Vermieter/Vertreter: {{landlord_name}}'
        }
      }
    }
  },
  
  fr: {
    lease: {
      standard: {
        title: 'CONTRAT DE LOCATION RÉSIDENTIELLE',
        parties: 'PARTIES AU CONTRAT',
        landlordSection: 'BAILLEUR',
        tenantSection: 'LOCATAIRE',
        propertySection: 'DESCRIPTION DU BIEN',
        termSection: 'DURÉE DU BAIL',
        rentSection: 'LOYER ET CONDITIONS DE PAIEMENT',
        depositSection: 'DÉPÔT DE GARANTIE',
        utilitiesSection: 'CHARGES ET SERVICES',
        rulesSection: 'RÈGLEMENT INTÉRIEUR',
        maintenanceSection: 'ENTRETIEN ET RÉPARATIONS',
        terminationSection: 'RÉSILIATION',
        signaturesSection: 'SIGNATURES',
        
        content: {
          intro: 'Ce contrat de location ("Contrat") est conclu le {{lease_start_date}}, entre les parties identifiées ci-dessous, pour la location du bien résidentiel décrit dans ce document.',
          
          propertyDesc: 'Le Bailleur loue par les présentes au Locataire, et le Locataire loue du Bailleur, le bien suivant : {{property_address}}, {{property_city}}, {{property_state}} {{property_zip}} ("Logement"), comprenant {{property_bedrooms}} chambre(s) et {{property_bathrooms}} salle(s) de bain.',
          
          termText: 'La durée de ce bail commence le {{lease_start_date}} et se termine le {{lease_end_date}}, pour une période de {{lease_term_months}} mois. Le bail peut être résilié avec un préavis de trois mois.',
          
          rentText: 'Le Locataire s\'engage à payer au Bailleur un loyer mensuel de {{monthly_rent}}€, payable mensuellement d\'avance le {{payment_due_day}} de chaque mois. Le premier mois de loyer de {{first_month_rent}}€ est dû à la signature du présent Contrat.',
          
          latePayment: 'En cas de retard de paiement après le {{payment_due_day}} du mois, le Locataire devra payer des frais de retard de {{late_fee_amount}}€ après un délai de grâce de {{late_fee_grace_period}} jours.',
          
          depositText: 'À la signature de ce Contrat, le Locataire dépose auprès du Bailleur la somme de {{security_deposit}}€ comme garantie. Le dépôt sera restitué dans les 30 jours suivant la fin du bail, moins les déductions pour dommages.',
          
          utilitiesText: 'Les charges suivantes sont incluses dans le loyer : {{utilities_included}}. Le Locataire est responsable du paiement des charges suivantes : {{tenant_pays}}.',
          
          rules: [
            'Il est interdit de fumer dans tout le logement',
            'Les animaux sont {{pets_allowed}}. Si autorisés, dépôt supplémentaire de {{pet_deposit}}€',
            'L\'occupation maximale est limitée à {{max_occupants}} personnes',
            'Les heures de silence sont de 22h00 à 8h00 tous les jours',
            'Aucune activité ou substance illégale sur les lieux',
            'Le Locataire doit maintenir une assurance habitation',
            'Aucune modification du bien sans accord écrit du Bailleur',
            'Stationnement limité aux places désignées'
          ],
          
          maintenanceText: 'Le Bailleur maintiendra les lieux en état habitable. Le Locataire maintiendra les lieux propres et informera immédiatement le Bailleur de tout problème d\'entretien.',
          
          terminationText: 'Chaque partie peut résilier ce bail avec un préavis écrit de 3 mois. La résiliation anticipée par le Locataire entraînera la perte du dépôt de garantie.',
          
          acknowledgment: 'En signant ci-dessous, les parties reconnaissent avoir lu, compris et accepté tous les termes et conditions de ce Contrat de Location.'
        }
      }
    },
    
    notices: {
      payOrQuit: {
        title: 'MISE EN DEMEURE DE PAYER OU DE QUITTER LES LIEUX',
        content: {
          to: 'À : {{tenant_name}} et tous autres occupants',
          address: 'ADRESSE DU BIEN : {{property_address}}',
          
          body: `Vous êtes par la présente informé que vous êtes en défaut de paiement du loyer pour le bien décrit ci-dessus.

Loyer total dû : {{amount_owed}}€
Pour la période : {{rent_months}}

Vous êtes par la présente requis de payer ledit loyer intégralement dans un délai de TROIS (3) JOURS à compter de la signification de cet avis ou de quitter et rendre les lieux décrits ci-dessus.

Si vous ne payez pas le montant total du loyer dû ou ne quittez pas les lieux dans les trois jours, une procédure judiciaire sera engagée contre vous.`,
          
          declaration: 'Je déclare sur l\'honneur que ce qui précède est exact.',
          
          dated: 'Daté du {{notice_date}}',
          
          signature: 'Bailleur/Agent : {{landlord_name}}'
        }
      }
    }
  },
  
  it: {
    lease: {
      standard: {
        title: 'CONTRATTO DI LOCAZIONE RESIDENZIALE',
        parties: 'PARTI DEL CONTRATTO',
        landlordSection: 'LOCATORE',
        tenantSection: 'CONDUTTORE',
        propertySection: 'DESCRIZIONE DELL\'IMMOBILE',
        termSection: 'DURATA DELLA LOCAZIONE',
        rentSection: 'CANONE E MODALITÀ DI PAGAMENTO',
        depositSection: 'DEPOSITO CAUZIONALE',
        utilitiesSection: 'UTENZE E SERVIZI',
        rulesSection: 'REGOLAMENTO INTERNO',
        maintenanceSection: 'MANUTENZIONE E RIPARAZIONI',
        terminationSection: 'RISOLUZIONE',
        signaturesSection: 'FIRME',
        
        content: {
          intro: 'Il presente Contratto di Locazione ("Contratto") è stipulato in data {{lease_start_date}}, tra le parti di seguito identificate, per la locazione dell\'immobile residenziale qui descritto.',
          
          propertyDesc: 'Il Locatore concede in locazione al Conduttore, e il Conduttore prende in locazione dal Locatore, il seguente immobile: {{property_address}}, {{property_city}}, {{property_state}} {{property_zip}} ("Immobile"), composto da {{property_bedrooms}} camera/e da letto e {{property_bathrooms}} bagno/i.',
          
          termText: 'La durata della locazione inizia il {{lease_start_date}} e termina il {{lease_end_date}}, per un periodo di {{lease_term_months}} mesi. Il contratto può essere disdetto con preavviso di tre mesi.',
          
          rentText: 'Il Conduttore si impegna a pagare al Locatore un canone mensile di €{{monthly_rent}}, pagabile mensilmente in anticipo il {{payment_due_day}} di ogni mese. Il primo mese di affitto di €{{first_month_rent}} è dovuto alla firma del presente Contratto.',
          
          latePayment: 'In caso di ritardo nel pagamento dopo il {{payment_due_day}} del mese, il Conduttore dovrà pagare una penale di €{{late_fee_amount}} dopo un periodo di grazia di {{late_fee_grace_period}} giorni.',
          
          depositText: 'Alla firma del presente Contratto, il Conduttore deposita presso il Locatore la somma di €{{security_deposit}} come cauzione. Il deposito sarà restituito entro 30 giorni dalla cessazione, al netto di eventuali detrazioni per danni.',
          
          utilitiesText: 'Le seguenti utenze sono incluse nel canone: {{utilities_included}}. Il Conduttore è responsabile del pagamento delle seguenti utenze: {{tenant_pays}}.',
          
          rules: [
            'È vietato fumare in tutto l\'immobile',
            'Gli animali domestici sono {{pets_allowed}}. Se consentiti, deposito aggiuntivo di €{{pet_deposit}}',
            'L\'occupazione massima è limitata a {{max_occupants}} persone',
            'Le ore di silenzio sono dalle 22:00 alle 8:00 ogni giorno',
            'Nessuna attività o sostanza illegale nei locali',
            'Il Conduttore deve mantenere un\'assicurazione sulla casa',
            'Nessuna modifica all\'immobile senza consenso scritto del Locatore',
            'Parcheggio limitato agli spazi designati'
          ],
          
          maintenanceText: 'Il Locatore manterrà i locali in condizioni abitabili. Il Conduttore manterrà i locali puliti e informerà immediatamente il Locatore di eventuali problemi di manutenzione.',
          
          terminationText: 'Ciascuna parte può risolvere questo contratto con preavviso scritto di 3 mesi. La risoluzione anticipata da parte del Conduttore comporterà la perdita del deposito cauzionale.',
          
          acknowledgment: 'Firmando di seguito, le parti riconoscono di aver letto, compreso e accettato tutti i termini e le condizioni del presente Contratto di Locazione.'
        }
      }
    },
    
    notices: {
      payOrQuit: {
        title: 'INTIMAZIONE DI PAGAMENTO O RILASCIO',
        content: {
          to: 'A: {{tenant_name}} e tutti gli altri occupanti',
          address: 'INDIRIZZO IMMOBILE: {{property_address}}',
          
          body: `Con la presente siete informati che siete in mora nel pagamento dell\'affitto per l\'immobile sopra descritto.

Affitto totale dovuto: €{{amount_owed}}
Per il periodo: {{rent_months}}

Siete quindi tenuti a pagare l\'affitto per intero entro TRE (3) GIORNI dalla notifica del presente avviso o a lasciare libero l\'immobile sopra descritto.

Se non pagherete l\'intero importo dell\'affitto dovuto o non lascerete l\'immobile entro tre giorni, verranno avviate azioni legali contro di voi.`,
          
          declaration: 'Dichiaro che quanto sopra è veritiero e corretto.',
          
          dated: 'Data {{notice_date}}',
          
          signature: 'Locatore/Agente: {{landlord_name}}'
        }
      }
    }
  }
};

// Helper function to get template in specific language
export const getTemplateInLanguage = (templateType, templateName, language = 'en') => {
  const lang = templateTranslations[language] || templateTranslations.en;
  return lang[templateType]?.[templateName] || templateTranslations.en[templateType]?.[templateName];
};

// Get available languages
export const getAvailableLanguages = () => [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' }
];

// Generate localized template HTML
export const generateLocalizedTemplate = (template, fieldValues, language = 'en') => {
  const translations = getTemplateInLanguage(template.category, template.type, language);
  if (!translations) return template.template;
  
  let html = `
    <div class="document-template" style="font-family: 'Georgia', serif; line-height: 1.8; color: #333;">
      <h1 style="text-align: center; font-size: 24px; margin-bottom: 30px; text-transform: uppercase; letter-spacing: 1px;">
        ${translations.title}
      </h1>
      
      <section style="margin-bottom: 30px;">
        <p style="text-align: justify; margin-bottom: 20px;">
          ${translations.content.intro}
        </p>
      </section>
      
      <section style="margin-bottom: 30px;">
        <h2 style="font-size: 18px; border-bottom: 2px solid #333; padding-bottom: 5px; margin-bottom: 15px;">
          ${translations.parties}
        </h2>
        
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px;">${translations.landlordSection}</h3>
          <div style="background: #f9f9f9; padding: 15px; border-left: 3px solid #2196F3;">
            <p><strong>Name:</strong> {{landlord_name}}</p>
            <p><strong>Address:</strong> {{landlord_address}}</p>
            <p><strong>Phone:</strong> {{landlord_phone}}</p>
            <p><strong>Email:</strong> {{landlord_email}}</p>
          </div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px;">${translations.tenantSection}</h3>
          <div style="background: #f9f9f9; padding: 15px; border-left: 3px solid #4CAF50;">
            <p><strong>Name:</strong> {{tenant_name}}</p>
            <p><strong>Phone:</strong> {{tenant_phone}}</p>
            <p><strong>Email:</strong> {{tenant_email}}</p>
            <p><strong>Current Address:</strong> {{tenant_current_address}}</p>
          </div>
        </div>
      </section>
      
      <section style="margin-bottom: 30px;">
        <h2 style="font-size: 18px; border-bottom: 2px solid #333; padding-bottom: 5px; margin-bottom: 15px;">
          ${translations.propertySection}
        </h2>
        <p style="text-align: justify;">
          ${translations.content.propertyDesc}
        </p>
      </section>
      
      <section style="margin-bottom: 30px;">
        <h2 style="font-size: 18px; border-bottom: 2px solid #333; padding-bottom: 5px; margin-bottom: 15px;">
          ${translations.termSection}
        </h2>
        <p style="text-align: justify;">
          ${translations.content.termText}
        </p>
      </section>
      
      <section style="margin-bottom: 30px;">
        <h2 style="font-size: 18px; border-bottom: 2px solid #333; padding-bottom: 5px; margin-bottom: 15px;">
          ${translations.rentSection}
        </h2>
        <p style="text-align: justify; margin-bottom: 15px;">
          ${translations.content.rentText}
        </p>
        <p style="text-align: justify;">
          ${translations.content.latePayment}
        </p>
      </section>
      
      <section style="margin-bottom: 30px;">
        <h2 style="font-size: 18px; border-bottom: 2px solid #333; padding-bottom: 5px; margin-bottom: 15px;">
          ${translations.depositSection}
        </h2>
        <p style="text-align: justify;">
          ${translations.content.depositText}
        </p>
      </section>
      
      <section style="margin-bottom: 30px;">
        <h2 style="font-size: 18px; border-bottom: 2px solid #333; padding-bottom: 5px; margin-bottom: 15px;">
          ${translations.rulesSection}
        </h2>
        <ol style="margin-left: 20px;">
          ${translations.content.rules.map(rule => `<li style="margin-bottom: 10px;">${rule}</li>`).join('')}
        </ol>
      </section>
      
      <section style="margin-bottom: 30px;">
        <h2 style="font-size: 18px; border-bottom: 2px solid #333; padding-bottom: 5px; margin-bottom: 15px;">
          ${translations.maintenanceSection}
        </h2>
        <p style="text-align: justify;">
          ${translations.content.maintenanceText}
        </p>
      </section>
      
      <section style="margin-bottom: 30px;">
        <h2 style="font-size: 18px; border-bottom: 2px solid #333; padding-bottom: 5px; margin-bottom: 15px;">
          ${translations.terminationSection}
        </h2>
        <p style="text-align: justify;">
          ${translations.content.terminationText}
        </p>
      </section>
      
      <section style="margin-bottom: 30px;">
        <p style="text-align: justify; font-style: italic; background: #fff3cd; padding: 15px; border-left: 3px solid #ffc107;">
          ${translations.content.acknowledgment}
        </p>
      </section>
      
      <section style="margin-top: 60px;">
        <h2 style="font-size: 18px; border-bottom: 2px solid #333; padding-bottom: 5px; margin-bottom: 30px;">
          ${translations.signaturesSection}
        </h2>
        
        <div style="display: flex; justify-content: space-between; margin-top: 50px;">
          <div style="width: 45%;">
            <div style="border-bottom: 2px solid #333; min-height: 60px;">
              {{landlord_signature}}
            </div>
            <p style="margin-top: 10px;">
              <strong>${translations.landlordSection}</strong><br/>
              Date: {{landlord_sign_date}}
            </p>
          </div>
          
          <div style="width: 45%;">
            <div style="border-bottom: 2px solid #333; min-height: 60px;">
              {{tenant_signature}}
            </div>
            <p style="margin-top: 10px;">
              <strong>${translations.tenantSection}</strong><br/>
              Date: {{tenant_sign_date}}
            </p>
          </div>
        </div>
      </section>
    </div>
  `;
  
  // Replace field placeholders with actual values
  Object.keys(fieldValues).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    html = html.replace(regex, fieldValues[key] || `[${key}]`);
  });
  
  return html;
};

export default templateTranslations;