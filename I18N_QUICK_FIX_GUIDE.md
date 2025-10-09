# i18n Quick Fix Guide - SwissAI Tax
## How to Fix Hardcoded Text in Your Components

This guide provides practical examples for fixing the most common hardcoded text patterns found in the SwissAI Tax application.

---

## 🎯 Quick Reference

### Basic Pattern

```jsx
// ❌ BEFORE (Hardcoded)
<Button>Save Changes</Button>

// ✅ AFTER (Translated)
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return <Button>{t('buttons.save_changes')}</Button>;
}
```

---

## 📋 Common Patterns & Fixes

### 1. Button Labels

```jsx
// ❌ BEFORE
<Button>Submit</Button>
<Button>Cancel</Button>
<Button onClick={handleSave}>Save</Button>

// ✅ AFTER
<Button>{t('buttons.submit')}</Button>
<Button>{t('buttons.cancel')}</Button>
<Button onClick={handleSave}>{t('buttons.save')}</Button>
```

**Translation Keys to Add:**
```json
{
  "buttons": {
    "submit": "Submit",
    "cancel": "Cancel",
    "save": "Save",
    "delete": "Delete",
    "edit": "Edit",
    "close": "Close",
    "confirm": "Confirm",
    "back": "Back",
    "next": "Next"
  }
}
```

---

### 2. Form Labels & Placeholders

```jsx
// ❌ BEFORE
<TextField
  label="Email Address"
  placeholder="Enter your email"
/>

<TextField
  label="Password"
  placeholder="Enter password"
/>

// ✅ AFTER
<TextField
  label={t('forms.email.label')}
  placeholder={t('forms.email.placeholder')}
/>

<TextField
  label={t('forms.password.label')}
  placeholder={t('forms.password.placeholder')}
/>
```

**Translation Keys to Add:**
```json
{
  "forms": {
    "email": {
      "label": "Email Address",
      "placeholder": "Enter your email"
    },
    "password": {
      "label": "Password",
      "placeholder": "Enter password"
    },
    "first_name": {
      "label": "First Name",
      "placeholder": "Enter first name"
    }
  }
}
```

---

### 3. Error Messages

```jsx
// ❌ BEFORE
toast.error('Failed to save changes');
setError('Something went wrong');

catch (error) {
  console.error(error);
  alert('Network error occurred');
}

// ✅ AFTER
toast.error(t('errors.save_failed'));
setError(t('errors.generic'));

catch (error) {
  console.error(error);
  alert(t('errors.network'));
}
```

**Translation Keys to Add:**
```json
{
  "errors": {
    "save_failed": "Failed to save changes",
    "generic": "Something went wrong",
    "network": "Network error occurred",
    "unauthorized": "You are not authorized",
    "not_found": "Resource not found",
    "server_error": "Server error. Please try again later."
  }
}
```

---

### 4. Validation Messages (Yup/Formik)

```jsx
// ❌ BEFORE
const schema = Yup.object({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required')
});

// ✅ AFTER (Two approaches)

// Approach 1: Use t() in component
const { t } = useTranslation();
const schema = Yup.object({
  email: Yup.string()
    .email(t('validation.email.invalid'))
    .required(t('validation.email.required')),
  password: Yup.string()
    .min(8, t('validation.password.min_length', { count: 8 }))
    .required(t('validation.password.required'))
});

// Approach 2: Create validation message function
import i18n from '../i18n';

const validationMessages = {
  email: {
    invalid: () => i18n.t('validation.email.invalid'),
    required: () => i18n.t('validation.email.required')
  },
  password: {
    minLength: (count) => i18n.t('validation.password.min_length', { count }),
    required: () => i18n.t('validation.password.required')
  }
};

const schema = Yup.object({
  email: Yup.string()
    .email(validationMessages.email.invalid())
    .required(validationMessages.email.required()),
  password: Yup.string()
    .min(8, validationMessages.password.minLength(8))
    .required(validationMessages.password.required())
});
```

**Translation Keys to Add:**
```json
{
  "validation": {
    "email": {
      "invalid": "Invalid email address",
      "required": "Email is required"
    },
    "password": {
      "required": "Password is required",
      "min_length": "Password must be at least {{count}} characters"
    },
    "required": "This field is required",
    "min": "Must be at least {{count}} characters",
    "max": "Must be no more than {{count}} characters"
  }
}
```

---

### 5. Modal Titles & Content

```jsx
// ❌ BEFORE
<Dialog open={open}>
  <DialogTitle>Confirm Deletion</DialogTitle>
  <DialogContent>
    <Typography>
      Are you sure you want to delete this item?
    </Typography>
  </DialogContent>
  <DialogActions>
    <Button onClick={onCancel}>Cancel</Button>
    <Button onClick={onConfirm}>Delete</Button>
  </DialogActions>
</Dialog>

// ✅ AFTER
<Dialog open={open}>
  <DialogTitle>{t('modals.delete.title')}</DialogTitle>
  <DialogContent>
    <Typography>
      {t('modals.delete.message')}
    </Typography>
  </DialogContent>
  <DialogActions>
    <Button onClick={onCancel}>{t('buttons.cancel')}</Button>
    <Button onClick={onConfirm}>{t('buttons.delete')}</Button>
  </DialogActions>
</Dialog>
```

**Translation Keys to Add:**
```json
{
  "modals": {
    "delete": {
      "title": "Confirm Deletion",
      "message": "Are you sure you want to delete this item?"
    },
    "save": {
      "title": "Save Changes",
      "message": "Do you want to save your changes?"
    }
  }
}
```

---

### 6. Status Messages & Toast Notifications

```jsx
// ❌ BEFORE
toast.success('Profile updated successfully!');
toast.error('Failed to update profile. Please try again.');
toast.info('Please wait while we process your request.');

// ✅ AFTER
toast.success(t('messages.profile_updated'));
toast.error(t('messages.profile_update_failed'));
toast.info(t('messages.processing'));
```

**Translation Keys to Add:**
```json
{
  "messages": {
    "profile_updated": "Profile updated successfully!",
    "profile_update_failed": "Failed to update profile. Please try again.",
    "processing": "Please wait while we process your request.",
    "saved": "Changes saved successfully",
    "deleted": "Item deleted successfully",
    "error_occurred": "An error occurred"
  }
}
```

---

### 7. Conditional Text

```jsx
// ❌ BEFORE
<Typography>
  {isLoading ? 'Loading...' : 'No data available'}
</Typography>

<Chip label={status === 'active' ? 'Active' : 'Inactive'} />

// ✅ AFTER
<Typography>
  {isLoading ? t('common.loading') : t('common.no_data')}
</Typography>

<Chip label={status === 'active' ? t('status.active') : t('status.inactive')} />
```

**Translation Keys to Add:**
```json
{
  "common": {
    "loading": "Loading...",
    "no_data": "No data available",
    "search": "Search",
    "filter": "Filter"
  },
  "status": {
    "active": "Active",
    "inactive": "Inactive",
    "pending": "Pending",
    "completed": "Completed"
  }
}
```

---

### 8. Array/Object Data

```jsx
// ❌ BEFORE
const options = [
  { value: 'option1', label: 'Option One' },
  { value: 'option2', label: 'Option Two' },
  { value: 'option3', label: 'Option Three' }
];

const countries = [
  { code: 'US', name: 'United States' },
  { code: 'CH', name: 'Switzerland' }
];

// ✅ AFTER
const { t } = useTranslation();

const options = [
  { value: 'option1', label: t('options.one') },
  { value: 'option2', label: t('options.two') },
  { value: 'option3', label: t('options.three') }
];

const countries = [
  { code: 'US', name: t('countries.united_states') },
  { code: 'CH', name: t('countries.switzerland') }
];
```

**Translation Keys to Add:**
```json
{
  "options": {
    "one": "Option One",
    "two": "Option Two",
    "three": "Option Three"
  },
  "countries": {
    "united_states": "United States",
    "switzerland": "Switzerland",
    "germany": "Germany",
    "france": "France"
  }
}
```

---

### 9. Table Headers

```jsx
// ❌ BEFORE
const columns = [
  { field: 'name', headerName: 'Name' },
  { field: 'email', headerName: 'Email' },
  { field: 'status', headerName: 'Status' }
];

// ✅ AFTER
const { t } = useTranslation();

const columns = [
  { field: 'name', headerName: t('table.headers.name') },
  { field: 'email', headerName: t('table.headers.email') },
  { field: 'status', headerName: t('table.headers.status') }
];
```

**Translation Keys to Add:**
```json
{
  "table": {
    "headers": {
      "name": "Name",
      "email": "Email",
      "status": "Status",
      "actions": "Actions",
      "date": "Date"
    },
    "empty": "No data available",
    "loading": "Loading data..."
  }
}
```

---

### 10. Alt Text & ARIA Labels

```jsx
// ❌ BEFORE
<img src={logo} alt="Company Logo" />
<IconButton aria-label="Delete item">
  <DeleteIcon />
</IconButton>

// ✅ AFTER
<img src={logo} alt={t('images.company_logo')} />
<IconButton aria-label={t('aria.delete_item')}>
  <DeleteIcon />
</IconButton>
```

**Translation Keys to Add:**
```json
{
  "images": {
    "company_logo": "Company Logo",
    "user_avatar": "User Avatar",
    "profile_picture": "Profile Picture"
  },
  "aria": {
    "delete_item": "Delete item",
    "edit_item": "Edit item",
    "close_dialog": "Close dialog",
    "toggle_password": "Toggle password visibility"
  }
}
```

---

## 🔧 Fixing Files Without i18n

### Step-by-Step Process

**1. Add import at top of file:**
```jsx
import { useTranslation } from 'react-i18next';
```

**2. Add hook in component:**
```jsx
function MyComponent() {
  const { t } = useTranslation();

  // rest of component
}
```

**3. Replace all hardcoded text:**
- Find all text between JSX tags: `<div>Text</div>`
- Find all label, placeholder, title attributes
- Find all toast/alert messages
- Find all validation messages

**4. Add translation keys to all 4 language files:**
- `src/locales/en/translation.json`
- `src/locales/de/translation.json`
- `src/locales/fr/translation.json`
- `src/locales/it/translation.json`

---

## 🚫 Common Mistakes to Avoid

### ❌ Mistake 1: Hardcoded Fallback
```jsx
// BAD - defeats the purpose of i18n
{t('key', 'Hardcoded fallback text')}

// GOOD - let i18n handle missing keys
{t('key')}
```

### ❌ Mistake 2: Not Using Hook
```jsx
// BAD - i18n not available
function MyComponent() {
  return <Button>Save</Button>;
}

// GOOD
function MyComponent() {
  const { t } = useTranslation();
  return <Button>{t('buttons.save')}</Button>;
}
```

### ❌ Mistake 3: Forgetting Placeholders
```jsx
// BAD - no translation
<TextField placeholder="Enter email" />

// GOOD
<TextField placeholder={t('forms.email.placeholder')} />
```

### ❌ Mistake 4: Not Translating Dynamic Text
```jsx
// BAD
const message = `Welcome, ${userName}!`;

// GOOD
const message = t('welcome.message', { name: userName });
// In translation: "welcome.message": "Welcome, {{name}}!"
```

---

## 📝 Checklist for Each File

When fixing a component, ensure:

- [ ] Imported `useTranslation` from `react-i18next`
- [ ] Added `const { t } = useTranslation();` hook
- [ ] Replaced all button labels with `{t('key')}`
- [ ] Replaced all form labels with `{t('key')}`
- [ ] Replaced all placeholders with `{t('key')}`
- [ ] Replaced all error messages with `t('key')`
- [ ] Replaced all toast messages with `t('key')`
- [ ] Replaced all modal titles/content with `t('key')`
- [ ] Replaced all table headers with `t('key')`
- [ ] Replaced all alt text with `t('key')`
- [ ] Replaced all aria-label with `t('key')`
- [ ] Added keys to EN translation file
- [ ] Added keys to DE translation file
- [ ] Added keys to FR translation file
- [ ] Added keys to IT translation file
- [ ] Tested language switcher
- [ ] No console errors about missing keys

---

## 🧪 Testing

### Test each fix by:

1. **Switch languages** using the language selector
2. **Check all 4 languages** (EN, DE, FR, IT)
3. **Verify no console errors** about missing translation keys
4. **Check text doesn't overflow** in longer languages (German tends to be longer)
5. **Test all states** (loading, error, success, empty)

### Quick Test Command
```javascript
// In browser console
localStorage.setItem('i18nextLng', 'de'); // Switch to German
location.reload(); // Reload page
```

---

## 🎓 Resources

### Official Documentation
- [react-i18next docs](https://react.i18next.com/)
- [i18next docs](https://www.i18next.com/)

### Project Files
- Translation files: `/src/locales/{en,de,fr,it}/translation.json`
- i18n config: `/src/i18n.js`
- Full analysis: `HARDCODED_TEXT_ANALYSIS.md`
- Executive summary: `TRANSLATION_ANALYSIS_EXECUTIVE_SUMMARY.md`

---

## 💡 Pro Tips

1. **Use nested keys** for organization:
   ```json
   {
     "pages": {
       "dashboard": {
         "title": "Dashboard",
         "subtitle": "Welcome back"
       }
     }
   }
   ```

2. **Use interpolation** for dynamic content:
   ```javascript
   t('welcome.message', { name: userName })
   // "welcome.message": "Welcome, {{name}}!"
   ```

3. **Use pluralization** for counts:
   ```javascript
   t('items.count', { count: itemCount })
   // "items.count_one": "{{count}} item"
   // "items.count_other": "{{count}} items"
   ```

4. **Keep keys semantic**, not literal:
   ```javascript
   // BAD
   t('click_here_to_save')

   // GOOD
   t('buttons.save')
   ```

---

## 📞 Need Help?

If you encounter issues:
1. Check the full analysis: `HARDCODED_TEXT_ANALYSIS.md`
2. Review existing translated components for patterns
3. Ask in team chat with specific file/line number
4. Reference this guide for common patterns

---

**Remember:** Every piece of user-facing text should use `t('key')` - no exceptions!
