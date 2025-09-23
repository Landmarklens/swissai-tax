// Comprehensive Document Templates Library
export const documentTemplates = {
  lease: {
    standard: {
      id: 'lease-standard',
      name: 'Standard Residential Lease Agreement',
      category: 'lease',
      description: 'Comprehensive lease agreement for residential properties',
      icon: 'gavel',
      fields: {
        // Landlord Information
        landlord_name: { label: 'Landlord Full Name', type: 'text', required: true },
        landlord_address: { label: 'Landlord Address', type: 'text', required: true },
        landlord_phone: { label: 'Landlord Phone', type: 'tel', required: true },
        landlord_email: { label: 'Landlord Email', type: 'email', required: true },
        
        // Tenant Information
        tenant_name: { label: 'Tenant Full Name', type: 'text', required: true },
        tenant_phone: { label: 'Tenant Phone', type: 'tel', required: true },
        tenant_email: { label: 'Tenant Email', type: 'email', required: true },
        tenant_current_address: { label: 'Tenant Current Address', type: 'text', required: true },
        tenant_employer: { label: 'Tenant Employer', type: 'text', required: false },
        tenant_emergency_contact: { label: 'Emergency Contact', type: 'text', required: true },
        tenant_emergency_phone: { label: 'Emergency Phone', type: 'tel', required: true },
        
        // Property Details
        property_address: { label: 'Property Address', type: 'text', required: true },
        property_city: { label: 'City', type: 'text', required: true },
        property_state: { label: 'State', type: 'text', required: true },
        property_zip: { label: 'ZIP Code', type: 'text', required: true },
        property_type: { label: 'Property Type', type: 'select', options: ['Apartment', 'House', 'Condo', 'Townhouse'], required: true },
        property_bedrooms: { label: 'Bedrooms', type: 'number', required: true },
        property_bathrooms: { label: 'Bathrooms', type: 'number', required: true },
        property_parking: { label: 'Parking Spaces', type: 'number', required: false },
        
        // Lease Terms
        lease_start_date: { label: 'Lease Start Date', type: 'date', required: true },
        lease_end_date: { label: 'Lease End Date', type: 'date', required: true },
        lease_term_months: { label: 'Lease Term (months)', type: 'number', required: true },
        
        // Financial Terms
        monthly_rent: { label: 'Monthly Rent', type: 'currency', required: true },
        security_deposit: { label: 'Security Deposit', type: 'currency', required: true },
        pet_deposit: { label: 'Pet Deposit', type: 'currency', required: false },
        first_month_rent: { label: 'First Month Rent', type: 'currency', required: true },
        last_month_rent: { label: 'Last Month Rent', type: 'currency', required: false },
        payment_due_day: { label: 'Rent Due Day of Month', type: 'number', min: 1, max: 31, required: true },
        late_fee_amount: { label: 'Late Fee Amount', type: 'currency', required: true },
        late_fee_grace_period: { label: 'Grace Period (days)', type: 'number', required: true },
        
        // Utilities
        utilities_included: { label: 'Utilities Included', type: 'multiselect', options: ['Water', 'Electricity', 'Gas', 'Trash', 'Internet', 'Cable'], required: false },
        tenant_pays: { label: 'Tenant Pays', type: 'multiselect', options: ['Water', 'Electricity', 'Gas', 'Trash', 'Internet', 'Cable'], required: false },
        
        // Rules & Restrictions
        pets_allowed: { label: 'Pets Allowed', type: 'select', options: ['Yes', 'No', 'With Permission'], required: true },
        smoking_allowed: { label: 'Smoking Allowed', type: 'select', options: ['Yes', 'No', 'Outside Only'], required: true },
        max_occupants: { label: 'Maximum Occupants', type: 'number', required: true },
        
        // Signatures
        landlord_signature: { label: 'Landlord Signature', type: 'signature', required: true },
        landlord_sign_date: { label: 'Landlord Sign Date', type: 'date', required: true },
        tenant_signature: { label: 'Tenant Signature', type: 'signature', required: true },
        tenant_sign_date: { label: 'Tenant Sign Date', type: 'date', required: true },
      },
      template: `
        <div class="document-template">
          <h1 style="text-align: center;">RESIDENTIAL LEASE AGREEMENT</h1>
          
          <section>
            <p>This Lease Agreement ("Agreement") is entered into on {{lease_start_date}}, by and between:</p>
            
            <h3>LANDLORD:</h3>
            <div class="info-block">
              <p><strong>Name:</strong> {{landlord_name}}</p>
              <p><strong>Address:</strong> {{landlord_address}}</p>
              <p><strong>Phone:</strong> {{landlord_phone}}</p>
              <p><strong>Email:</strong> {{landlord_email}}</p>
            </div>
            
            <h3>TENANT(S):</h3>
            <div class="info-block">
              <p><strong>Name:</strong> {{tenant_name}}</p>
              <p><strong>Current Address:</strong> {{tenant_current_address}}</p>
              <p><strong>Phone:</strong> {{tenant_phone}}</p>
              <p><strong>Email:</strong> {{tenant_email}}</p>
              <p><strong>Emergency Contact:</strong> {{tenant_emergency_contact}} - {{tenant_emergency_phone}}</p>
            </div>
          </section>
          
          <section>
            <h3>1. PROPERTY</h3>
            <p>The Landlord agrees to rent to the Tenant the following property:</p>
            <div class="info-block">
              <p><strong>Address:</strong> {{property_address}}</p>
              <p><strong>City:</strong> {{property_city}}, <strong>State:</strong> {{property_state}} <strong>ZIP:</strong> {{property_zip}}</p>
              <p><strong>Type:</strong> {{property_type}}</p>
              <p><strong>Bedrooms:</strong> {{property_bedrooms}} | <strong>Bathrooms:</strong> {{property_bathrooms}} | <strong>Parking:</strong> {{property_parking}}</p>
            </div>
          </section>
          
          <section>
            <h3>2. LEASE TERM</h3>
            <p>The lease term will begin on <strong>{{lease_start_date}}</strong> and end on <strong>{{lease_end_date}}</strong> for a total of <strong>{{lease_term_months}}</strong> months.</p>
          </section>
          
          <section>
            <h3>3. RENT & PAYMENTS</h3>
            <ul>
              <li>Monthly Rent: <strong>$\{{monthly_rent}}</strong></li>
              <li>Due Date: <strong>{{payment_due_day}}</strong> of each month</li>
              <li>Late Fee: <strong>$\{{late_fee_amount}}</strong> after <strong>{{late_fee_grace_period}}</strong> day grace period</li>
              <li>Security Deposit: <strong>$\{{security_deposit}}</strong></li>
              <li>Pet Deposit: <strong>$\{{pet_deposit}}</strong></li>
              <li>First Month's Rent: <strong>$\{{first_month_rent}}</strong></li>
              <li>Last Month's Rent: <strong>$\{{last_month_rent}}</strong></li>
            </ul>
          </section>
          
          <section>
            <h3>4. UTILITIES</h3>
            <p><strong>Included in Rent:</strong> {{utilities_included}}</p>
            <p><strong>Tenant Responsibility:</strong> {{tenant_pays}}</p>
          </section>
          
          <section>
            <h3>5. RULES & RESTRICTIONS</h3>
            <ul>
              <li>Pets Allowed: <strong>{{pets_allowed}}</strong></li>
              <li>Smoking: <strong>{{smoking_allowed}}</strong></li>
              <li>Maximum Occupants: <strong>{{max_occupants}}</strong></li>
            </ul>
          </section>
          
          <section class="signature-section">
            <h3>SIGNATURES</h3>
            <div class="signature-grid">
              <div class="signature-block">
                <p>Landlord Signature:</p>
                <div class="signature-line">{{landlord_signature}}</div>
                <p>Date: {{landlord_sign_date}}</p>
              </div>
              <div class="signature-block">
                <p>Tenant Signature:</p>
                <div class="signature-line">{{tenant_signature}}</div>
                <p>Date: {{tenant_sign_date}}</p>
              </div>
            </div>
          </section>
        </div>
      `
    },
    
    monthToMonth: {
      id: 'lease-month-to-month',
      name: 'Month-to-Month Rental Agreement',
      category: 'lease',
      description: 'Flexible monthly rental agreement with 30-day notice period',
      icon: 'calendar',
      fields: {
        landlord_name: { label: 'Landlord Name', type: 'text', required: true },
        landlord_phone: { label: 'Landlord Phone', type: 'tel', required: true },
        tenant_name: { label: 'Tenant Name', type: 'text', required: true },
        tenant_phone: { label: 'Tenant Phone', type: 'tel', required: true },
        property_address: { label: 'Property Address', type: 'text', required: true },
        start_date: { label: 'Start Date', type: 'date', required: true },
        monthly_rent: { label: 'Monthly Rent', type: 'currency', required: true },
        security_deposit: { label: 'Security Deposit', type: 'currency', required: true },
        notice_period: { label: 'Notice Period (days)', type: 'number', default: 30, required: true },
        payment_due_day: { label: 'Rent Due Day', type: 'number', required: true },
        landlord_signature: { label: 'Landlord Signature', type: 'signature', required: true },
        tenant_signature: { label: 'Tenant Signature', type: 'signature', required: true },
      },
      template: `
        <div class="document-template">
          <h1>MONTH-TO-MONTH RENTAL AGREEMENT</h1>
          <p>This agreement is entered into on {{start_date}} and continues on a month-to-month basis.</p>
          
          <h3>PARTIES</h3>
          <p>Landlord: {{landlord_name}} ({{landlord_phone}})</p>
          <p>Tenant: {{tenant_name}} ({{tenant_phone}})</p>
          
          <h3>PROPERTY</h3>
          <p>{{property_address}}</p>
          
          <h3>TERMS</h3>
          <ul>
            <li>Monthly Rent: $\{{monthly_rent}}</li>
            <li>Security Deposit: $\{{security_deposit}}</li>
            <li>Rent Due: {{payment_due_day}} of each month</li>
            <li>Notice Period: {{notice_period}} days</li>
          </ul>
          
          <div class="signature-section">
            <div>Landlord: {{landlord_signature}}</div>
            <div>Tenant: {{tenant_signature}}</div>
          </div>
        </div>
      `
    },
    
    roommate: {
      id: 'lease-roommate',
      name: 'Roommate Agreement',
      category: 'lease',
      description: 'Agreement between roommates sharing a rental property',
      icon: 'people',
      fields: {
        property_address: { label: 'Property Address', type: 'text', required: true },
        lease_holder: { label: 'Primary Lease Holder', type: 'text', required: true },
        roommate_name: { label: 'Roommate Name', type: 'text', required: true },
        move_in_date: { label: 'Move-in Date', type: 'date', required: true },
        monthly_rent_share: { label: 'Monthly Rent Share', type: 'currency', required: true },
        security_deposit_share: { label: 'Security Deposit Share', type: 'currency', required: true },
        utilities_split: { label: 'Utilities Split (%)', type: 'number', required: true },
        common_areas: { label: 'Common Areas', type: 'multiselect', options: ['Kitchen', 'Living Room', 'Bathroom', 'Laundry'], required: true },
        private_space: { label: 'Private Space', type: 'text', required: true },
        house_rules: { label: 'House Rules', type: 'textarea', required: false },
        chores_schedule: { label: 'Chores Schedule', type: 'textarea', required: false },
        guest_policy: { label: 'Guest Policy', type: 'textarea', required: true },
        quiet_hours: { label: 'Quiet Hours', type: 'text', required: true },
        notice_period: { label: 'Move-out Notice (days)', type: 'number', default: 30, required: true },
        signature_1: { label: 'Lease Holder Signature', type: 'signature', required: true },
        signature_2: { label: 'Roommate Signature', type: 'signature', required: true },
      }
    },
    
    commercial: {
      id: 'lease-commercial',
      name: 'Commercial Lease Agreement',
      category: 'lease',
      description: 'Commercial property lease for business use',
      icon: 'business',
      fields: {
        landlord_company: { label: 'Landlord/Company Name', type: 'text', required: true },
        tenant_company: { label: 'Tenant Company Name', type: 'text', required: true },
        tenant_business_type: { label: 'Type of Business', type: 'text', required: true },
        property_address: { label: 'Property Address', type: 'text', required: true },
        square_footage: { label: 'Square Footage', type: 'number', required: true },
        lease_term_years: { label: 'Lease Term (years)', type: 'number', required: true },
        monthly_base_rent: { label: 'Base Monthly Rent', type: 'currency', required: true },
        common_area_maintenance: { label: 'CAM Fees', type: 'currency', required: false },
        property_tax_share: { label: 'Property Tax Share', type: 'currency', required: false },
        insurance_required: { label: 'Insurance Requirements', type: 'textarea', required: true },
        permitted_use: { label: 'Permitted Use', type: 'textarea', required: true },
        renewal_option: { label: 'Renewal Option', type: 'select', options: ['Yes', 'No'], required: true },
        signature_landlord: { label: 'Landlord Signature', type: 'signature', required: true },
        signature_tenant: { label: 'Tenant Signature', type: 'signature', required: true },
      }
    }
  },
  
  notices: {
    payOrQuit: {
      id: 'notice-pay-or-quit',
      name: '3-Day Pay or Quit Notice',
      category: 'notices',
      description: 'Notice to tenant for unpaid rent',
      icon: 'warning',
      fields: {
        tenant_name: { label: 'Tenant Name', type: 'text', required: true },
        property_address: { label: 'Property Address', type: 'text', required: true },
        amount_owed: { label: 'Total Amount Owed', type: 'currency', required: true },
        rent_months: { label: 'Unpaid Months', type: 'text', required: true },
        notice_date: { label: 'Notice Date', type: 'date', required: true },
        deadline_date: { label: 'Payment Deadline', type: 'date', required: true },
        landlord_name: { label: 'Landlord Name', type: 'text', required: true },
        landlord_signature: { label: 'Landlord Signature', type: 'signature', required: true },
      },
      template: `
        <div class="document-template">
          <h1>3-DAY NOTICE TO PAY RENT OR QUIT</h1>
          <p>Date: {{notice_date}}</p>
          
          <p>TO: {{tenant_name}}</p>
          <p>PROPERTY: {{property_address}}</p>
          
          <p>You are hereby notified that you are in default of your rental agreement for non-payment of rent.</p>
          
          <p>Amount Owed: <strong>$\{{amount_owed}}</strong></p>
          <p>For the period(s): {{rent_months}}</p>
          
          <p>You are required to pay the amount owed or vacate the premises by: <strong>{{deadline_date}}</strong></p>
          
          <p>Landlord: {{landlord_name}}</p>
          <div>{{landlord_signature}}</div>
        </div>
      `
    },
    
    leaseTermination: {
      id: 'notice-lease-termination',
      name: 'Lease Termination Notice',
      category: 'notices',
      description: 'Notice to terminate lease agreement',
      icon: 'exit',
      fields: {
        sender_type: { label: 'Notice From', type: 'select', options: ['Landlord', 'Tenant'], required: true },
        recipient_name: { label: 'Recipient Name', type: 'text', required: true },
        property_address: { label: 'Property Address', type: 'text', required: true },
        termination_date: { label: 'Termination Date', type: 'date', required: true },
        notice_days: { label: 'Notice Period (days)', type: 'number', default: 30, required: true },
        reason: { label: 'Reason for Termination', type: 'textarea', required: false },
        forwarding_address: { label: 'Forwarding Address', type: 'text', required: false },
        sender_name: { label: 'Sender Name', type: 'text', required: true },
        sender_signature: { label: 'Signature', type: 'signature', required: true },
      }
    },
    
    rentIncrease: {
      id: 'notice-rent-increase',
      name: 'Rent Increase Notice',
      category: 'notices',
      description: 'Notice of rent increase to tenant',
      icon: 'trending_up',
      fields: {
        tenant_name: { label: 'Tenant Name', type: 'text', required: true },
        property_address: { label: 'Property Address', type: 'text', required: true },
        current_rent: { label: 'Current Rent', type: 'currency', required: true },
        new_rent: { label: 'New Rent Amount', type: 'currency', required: true },
        increase_amount: { label: 'Increase Amount', type: 'currency', required: true },
        increase_percentage: { label: 'Increase Percentage', type: 'number', required: true },
        effective_date: { label: 'Effective Date', type: 'date', required: true },
        notice_date: { label: 'Notice Date', type: 'date', required: true },
        landlord_name: { label: 'Landlord Name', type: 'text', required: true },
        landlord_signature: { label: 'Landlord Signature', type: 'signature', required: true },
      }
    },
    
    entryNotice: {
      id: 'notice-entry',
      name: 'Notice of Entry',
      category: 'notices',
      description: 'Notice to tenant of landlord entry',
      icon: 'door',
      fields: {
        tenant_name: { label: 'Tenant Name', type: 'text', required: true },
        property_address: { label: 'Property Address', type: 'text', required: true },
        entry_date: { label: 'Entry Date', type: 'date', required: true },
        entry_time: { label: 'Entry Time', type: 'time', required: true },
        entry_reason: { label: 'Reason for Entry', type: 'select', options: ['Maintenance', 'Inspection', 'Repairs', 'Showing to Prospective Tenants', 'Emergency'], required: true },
        entry_details: { label: 'Additional Details', type: 'textarea', required: false },
        landlord_name: { label: 'Landlord Name', type: 'text', required: true },
        notice_date: { label: 'Notice Date', type: 'date', required: true },
      }
    }
  },
  
  addendums: {
    petAddendum: {
      id: 'addendum-pet',
      name: 'Pet Addendum',
      category: 'addendums',
      description: 'Addendum for allowing pets in rental property',
      icon: 'pets',
      fields: {
        tenant_name: { label: 'Tenant Name', type: 'text', required: true },
        property_address: { label: 'Property Address', type: 'text', required: true },
        pet_type: { label: 'Type of Pet', type: 'select', options: ['Dog', 'Cat', 'Bird', 'Fish', 'Other'], required: true },
        pet_breed: { label: 'Breed', type: 'text', required: true },
        pet_name: { label: 'Pet Name', type: 'text', required: true },
        pet_weight: { label: 'Pet Weight (lbs)', type: 'number', required: true },
        pet_age: { label: 'Pet Age', type: 'text', required: true },
        pet_deposit: { label: 'Pet Deposit', type: 'currency', required: true },
        monthly_pet_rent: { label: 'Monthly Pet Rent', type: 'currency', required: false },
        pet_rules: { label: 'Pet Rules & Restrictions', type: 'textarea', required: true },
        vaccination_required: { label: 'Vaccination Required', type: 'select', options: ['Yes', 'No'], required: true },
        landlord_signature: { label: 'Landlord Signature', type: 'signature', required: true },
        tenant_signature: { label: 'Tenant Signature', type: 'signature', required: true },
      }
    },
    
    parkingAddendum: {
      id: 'addendum-parking',
      name: 'Parking Space Addendum',
      category: 'addendums',
      description: 'Addendum for assigned parking spaces',
      icon: 'parking',
      fields: {
        tenant_name: { label: 'Tenant Name', type: 'text', required: true },
        property_address: { label: 'Property Address', type: 'text', required: true },
        parking_space_number: { label: 'Parking Space Number', type: 'text', required: true },
        parking_location: { label: 'Parking Location', type: 'text', required: true },
        vehicle_make: { label: 'Vehicle Make', type: 'text', required: true },
        vehicle_model: { label: 'Vehicle Model', type: 'text', required: true },
        vehicle_year: { label: 'Vehicle Year', type: 'number', required: true },
        vehicle_color: { label: 'Vehicle Color', type: 'text', required: true },
        license_plate: { label: 'License Plate', type: 'text', required: true },
        monthly_parking_fee: { label: 'Monthly Parking Fee', type: 'currency', required: false },
        landlord_signature: { label: 'Landlord Signature', type: 'signature', required: true },
        tenant_signature: { label: 'Tenant Signature', type: 'signature', required: true },
      }
    },
    
    smokingAddendum: {
      id: 'addendum-smoking',
      name: 'No Smoking Addendum',
      category: 'addendums',
      description: 'Addendum prohibiting smoking on property',
      icon: 'smoke_free',
      fields: {
        tenant_name: { label: 'Tenant Name', type: 'text', required: true },
        property_address: { label: 'Property Address', type: 'text', required: true },
        smoking_policy: { label: 'Smoking Policy', type: 'select', options: ['No Smoking Anywhere', 'Designated Areas Only', 'Outside Only'], required: true },
        violation_fee: { label: 'Violation Fee', type: 'currency', required: true },
        cleaning_fee: { label: 'Cleaning Fee if Violated', type: 'currency', required: true },
        landlord_signature: { label: 'Landlord Signature', type: 'signature', required: true },
        tenant_signature: { label: 'Tenant Signature', type: 'signature', required: true },
      }
    }
  },
  
  maintenance: {
    moveInInspection: {
      id: 'inspection-move-in',
      name: 'Move-In Inspection Checklist',
      category: 'maintenance',
      description: 'Property condition checklist for move-in',
      icon: 'checklist',
      fields: {
        tenant_name: { label: 'Tenant Name', type: 'text', required: true },
        property_address: { label: 'Property Address', type: 'text', required: true },
        inspection_date: { label: 'Inspection Date', type: 'date', required: true },
        
        // Room conditions
        living_room_condition: { label: 'Living Room Condition', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'], required: true },
        living_room_notes: { label: 'Living Room Notes', type: 'textarea', required: false },
        
        kitchen_condition: { label: 'Kitchen Condition', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'], required: true },
        kitchen_appliances: { label: 'Kitchen Appliances Working', type: 'multiselect', options: ['Refrigerator', 'Stove', 'Oven', 'Microwave', 'Dishwasher', 'Garbage Disposal'], required: true },
        kitchen_notes: { label: 'Kitchen Notes', type: 'textarea', required: false },
        
        bedroom_condition: { label: 'Bedroom(s) Condition', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'], required: true },
        bedroom_notes: { label: 'Bedroom Notes', type: 'textarea', required: false },
        
        bathroom_condition: { label: 'Bathroom(s) Condition', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'], required: true },
        bathroom_notes: { label: 'Bathroom Notes', type: 'textarea', required: false },
        
        // Utilities
        electricity_working: { label: 'Electricity Working', type: 'select', options: ['Yes', 'No', 'Partial'], required: true },
        plumbing_working: { label: 'Plumbing Working', type: 'select', options: ['Yes', 'No', 'Partial'], required: true },
        heating_working: { label: 'Heating Working', type: 'select', options: ['Yes', 'No', 'N/A'], required: true },
        ac_working: { label: 'A/C Working', type: 'select', options: ['Yes', 'No', 'N/A'], required: true },
        
        // Keys
        keys_provided: { label: 'Number of Keys Provided', type: 'number', required: true },
        garage_remote: { label: 'Garage Remote Provided', type: 'select', options: ['Yes', 'No', 'N/A'], required: true },
        
        existing_damages: { label: 'Existing Damages/Issues', type: 'textarea', required: false },
        photos_taken: { label: 'Photos Taken', type: 'select', options: ['Yes', 'No'], required: true },
        
        landlord_signature: { label: 'Landlord Signature', type: 'signature', required: true },
        tenant_signature: { label: 'Tenant Signature', type: 'signature', required: true },
      }
    },
    
    maintenanceRequest: {
      id: 'maintenance-request',
      name: 'Maintenance Request Form',
      category: 'maintenance',
      description: 'Form for tenants to request maintenance',
      icon: 'build',
      fields: {
        tenant_name: { label: 'Tenant Name', type: 'text', required: true },
        tenant_phone: { label: 'Contact Phone', type: 'tel', required: true },
        tenant_email: { label: 'Email', type: 'email', required: true },
        property_address: { label: 'Property Address', type: 'text', required: true },
        request_date: { label: 'Request Date', type: 'date', required: true },
        urgency: { label: 'Urgency Level', type: 'select', options: ['Emergency', 'Urgent', 'Routine'], required: true },
        issue_location: { label: 'Location of Issue', type: 'text', required: true },
        issue_description: { label: 'Description of Issue', type: 'textarea', required: true },
        permission_to_enter: { label: 'Permission to Enter', type: 'select', options: ['Yes', 'No', 'Call First'], required: true },
        preferred_time: { label: 'Preferred Time', type: 'text', required: false },
        tenant_signature: { label: 'Tenant Signature', type: 'signature', required: true },
      }
    },
    
    moveOutInspection: {
      id: 'inspection-move-out',
      name: 'Move-Out Inspection Report',
      category: 'maintenance',
      description: 'Property condition report for move-out',
      icon: 'assignment',
      fields: {
        tenant_name: { label: 'Tenant Name', type: 'text', required: true },
        property_address: { label: 'Property Address', type: 'text', required: true },
        move_out_date: { label: 'Move-Out Date', type: 'date', required: true },
        inspection_date: { label: 'Inspection Date', type: 'date', required: true },
        
        // Comparison with move-in
        overall_condition: { label: 'Overall Condition vs Move-In', type: 'select', options: ['Same', 'Better', 'Normal Wear', 'Damaged'], required: true },
        
        // Cleaning
        property_cleaned: { label: 'Property Cleaned', type: 'select', options: ['Yes', 'No', 'Partial'], required: true },
        carpet_cleaned: { label: 'Carpets Cleaned', type: 'select', options: ['Yes', 'No', 'N/A'], required: true },
        
        // Damages
        damages_found: { label: 'Damages Found', type: 'select', options: ['Yes', 'No'], required: true },
        damage_description: { label: 'Damage Description', type: 'textarea', required: false },
        estimated_repair_cost: { label: 'Estimated Repair Cost', type: 'currency', required: false },
        
        // Keys
        keys_returned: { label: 'All Keys Returned', type: 'select', options: ['Yes', 'No'], required: true },
        missing_items: { label: 'Missing Items', type: 'textarea', required: false },
        
        // Deposit
        security_deposit_amount: { label: 'Security Deposit Amount', type: 'currency', required: true },
        deductions: { label: 'Total Deductions', type: 'currency', required: true },
        deposit_refund: { label: 'Deposit to be Refunded', type: 'currency', required: true },
        
        forwarding_address: { label: 'Forwarding Address', type: 'text', required: true },
        
        landlord_signature: { label: 'Landlord Signature', type: 'signature', required: true },
        tenant_signature: { label: 'Tenant Signature', type: 'signature', required: false },
      }
    }
  },
  
  financial: {
    rentReceipt: {
      id: 'financial-rent-receipt',
      name: 'Rent Receipt',
      category: 'financial',
      description: 'Receipt for rent payment',
      icon: 'receipt',
      fields: {
        receipt_number: { label: 'Receipt Number', type: 'text', required: true },
        tenant_name: { label: 'Tenant Name', type: 'text', required: true },
        property_address: { label: 'Property Address', type: 'text', required: true },
        payment_date: { label: 'Payment Date', type: 'date', required: true },
        payment_period: { label: 'Payment Period', type: 'text', required: true },
        amount_paid: { label: 'Amount Paid', type: 'currency', required: true },
        payment_method: { label: 'Payment Method', type: 'select', options: ['Cash', 'Check', 'Bank Transfer', 'Online Payment', 'Money Order'], required: true },
        check_number: { label: 'Check/Transaction Number', type: 'text', required: false },
        balance_due: { label: 'Balance Due', type: 'currency', default: 0, required: false },
        landlord_name: { label: 'Received By', type: 'text', required: true },
        landlord_signature: { label: 'Signature', type: 'signature', required: true },
      }
    },
    
    securityDepositReceipt: {
      id: 'financial-deposit-receipt',
      name: 'Security Deposit Receipt',
      category: 'financial',
      description: 'Receipt for security deposit payment',
      icon: 'account_balance',
      fields: {
        tenant_name: { label: 'Tenant Name', type: 'text', required: true },
        property_address: { label: 'Property Address', type: 'text', required: true },
        receipt_date: { label: 'Receipt Date', type: 'date', required: true },
        deposit_amount: { label: 'Deposit Amount', type: 'currency', required: true },
        payment_method: { label: 'Payment Method', type: 'select', options: ['Cash', 'Check', 'Bank Transfer', 'Money Order'], required: true },
        check_number: { label: 'Check Number', type: 'text', required: false },
        deposit_held_at: { label: 'Deposit Held At (Bank)', type: 'text', required: true },
        account_number_last4: { label: 'Account Last 4 Digits', type: 'text', maxLength: 4, required: false },
        conditions: { label: 'Conditions for Return', type: 'textarea', required: true },
        landlord_name: { label: 'Landlord Name', type: 'text', required: true },
        landlord_signature: { label: 'Landlord Signature', type: 'signature', required: true },
      }
    },
    
    lateFeeNotice: {
      id: 'financial-late-fee',
      name: 'Late Fee Notice',
      category: 'financial',
      description: 'Notice of late fee assessment',
      icon: 'schedule',
      fields: {
        tenant_name: { label: 'Tenant Name', type: 'text', required: true },
        property_address: { label: 'Property Address', type: 'text', required: true },
        notice_date: { label: 'Notice Date', type: 'date', required: true },
        rent_due_date: { label: 'Rent Due Date', type: 'date', required: true },
        rent_amount: { label: 'Monthly Rent Amount', type: 'currency', required: true },
        days_late: { label: 'Days Late', type: 'number', required: true },
        late_fee_amount: { label: 'Late Fee Amount', type: 'currency', required: true },
        total_due: { label: 'Total Amount Due', type: 'currency', required: true },
        payment_deadline: { label: 'Payment Deadline', type: 'date', required: true },
        landlord_name: { label: 'Landlord Name', type: 'text', required: true },
      }
    }
  },
  
  disclosures: {
    leadPaintDisclosure: {
      id: 'disclosure-lead-paint',
      name: 'Lead-Based Paint Disclosure',
      category: 'disclosures',
      description: 'Required disclosure for properties built before 1978',
      icon: 'warning',
      fields: {
        property_address: { label: 'Property Address', type: 'text', required: true },
        year_built: { label: 'Year Built', type: 'number', required: true },
        lead_paint_known: { label: 'Known Lead Paint', type: 'select', options: ['Yes', 'No', 'Unknown'], required: true },
        lead_paint_location: { label: 'Location of Lead Paint', type: 'textarea', required: false },
        records_available: { label: 'Records Available', type: 'select', options: ['Yes', 'No'], required: true },
        pamphlet_provided: { label: 'EPA Pamphlet Provided', type: 'select', options: ['Yes', 'No'], required: true },
        tenant_acknowledgment: { label: 'Tenant Acknowledges Receipt', type: 'checkbox', required: true },
        landlord_name: { label: 'Landlord Name', type: 'text', required: true },
        landlord_signature: { label: 'Landlord Signature', type: 'signature', required: true },
        tenant_name: { label: 'Tenant Name', type: 'text', required: true },
        tenant_signature: { label: 'Tenant Signature', type: 'signature', required: true },
        date_signed: { label: 'Date', type: 'date', required: true },
      }
    },
    
    moldDisclosure: {
      id: 'disclosure-mold',
      name: 'Mold Disclosure',
      category: 'disclosures',
      description: 'Disclosure about mold conditions and prevention',
      icon: 'grass',
      fields: {
        property_address: { label: 'Property Address', type: 'text', required: true },
        mold_present: { label: 'Mold Currently Present', type: 'select', options: ['Yes', 'No', 'Unknown'], required: true },
        mold_location: { label: 'Location if Present', type: 'textarea', required: false },
        past_mold_issues: { label: 'Past Mold Issues', type: 'select', options: ['Yes', 'No', 'Unknown'], required: true },
        remediation_done: { label: 'Remediation Completed', type: 'select', options: ['Yes', 'No', 'N/A'], required: false },
        prevention_measures: { label: 'Prevention Measures', type: 'textarea', required: true },
        tenant_responsibilities: { label: 'Tenant Responsibilities', type: 'textarea', required: true },
        landlord_signature: { label: 'Landlord Signature', type: 'signature', required: true },
        tenant_signature: { label: 'Tenant Signature', type: 'signature', required: true },
      }
    },
    
    bedbugDisclosure: {
      id: 'disclosure-bedbug',
      name: 'Bedbug Disclosure',
      category: 'disclosures',
      description: 'Disclosure about bedbug history and prevention',
      icon: 'bug_report',
      fields: {
        property_address: { label: 'Property Address', type: 'text', required: true },
        current_infestation: { label: 'Current Infestation', type: 'select', options: ['Yes', 'No'], required: true },
        past_infestation: { label: 'Past Infestation', type: 'select', options: ['Yes', 'No', 'Unknown'], required: true },
        last_treatment_date: { label: 'Last Treatment Date', type: 'date', required: false },
        treatment_company: { label: 'Treatment Company', type: 'text', required: false },
        prevention_measures: { label: 'Prevention Measures', type: 'textarea', required: true },
        reporting_requirement: { label: 'Tenant Must Report Within (days)', type: 'number', default: 3, required: true },
        landlord_signature: { label: 'Landlord Signature', type: 'signature', required: true },
        tenant_signature: { label: 'Tenant Signature', type: 'signature', required: true },
      }
    }
  }
};

// Helper function to get all templates as flat array
export const getAllTemplates = () => {
  const templates = [];
  Object.values(documentTemplates).forEach(category => {
    Object.values(category).forEach(template => {
      templates.push(template);
    });
  });
  return templates;
};

// Helper function to get template by ID
export const getTemplateById = (id) => {
  return getAllTemplates().find(template => template.id === id);
};

// Helper function to get templates by category
export const getTemplatesByCategory = (category) => {
  return documentTemplates[category] ? Object.values(documentTemplates[category]) : [];
};

// Helper function to generate document HTML from template and field values
export const generateDocumentHTML = (template, fieldValues) => {
  let html = template.template;
  
  // Replace all field placeholders with actual values
  Object.keys(fieldValues).forEach(fieldKey => {
    const regex = new RegExp(`{{${fieldKey}}}`, 'g');
    const value = fieldValues[fieldKey] || `[${fieldKey}]`;
    html = html.replace(regex, value);
  });
  
  // Add default styles
  const styledHTML = `
    <style>
      .document-template {
        font-family: 'Times New Roman', serif;
        line-height: 1.6;
        max-width: 800px;
        margin: 0 auto;
        padding: 40px;
      }
      .document-template h1 {
        text-align: center;
        margin-bottom: 30px;
      }
      .document-template h3 {
        margin-top: 25px;
        margin-bottom: 15px;
        border-bottom: 1px solid #ccc;
        padding-bottom: 5px;
      }
      .info-block {
        background: #f5f5f5;
        padding: 15px;
        margin: 10px 0;
        border-radius: 5px;
      }
      .signature-section {
        margin-top: 50px;
        page-break-inside: avoid;
      }
      .signature-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 50px;
        margin-top: 30px;
      }
      .signature-block {
        border-top: 2px solid #333;
        padding-top: 10px;
      }
      .signature-line {
        min-height: 60px;
        border-bottom: 1px solid #333;
        margin: 20px 0;
      }
      section {
        margin: 30px 0;
        page-break-inside: avoid;
      }
      ul {
        margin: 15px 0;
        padding-left: 30px;
      }
      li {
        margin: 8px 0;
      }
      @media print {
        .document-template {
          padding: 20px;
        }
      }
    </style>
    ${html}
  `;
  
  return styledHTML;
};

export default documentTemplates;