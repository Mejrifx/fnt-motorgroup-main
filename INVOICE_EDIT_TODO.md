# Invoice Edit Feature - Remaining Manual Updates

## Status
- ✅ invoiceUtils.ts - Added updateInvoiceInDatabase and Invoice interface  
- ✅ FNTSaleInvoiceForm.tsx - Full edit support implemented
- ✅ FNTPurchaseInvoiceForm.tsx - Full edit support implemented
- ⚠️ FNTFinanceInvoiceForm.tsx - Imports and props updated, need component logic
- ⚠️ TNTInvoiceForm.tsx - Imports and props updated, need component logic

## FNTFinanceInvoiceForm.tsx - Remaining Changes

### 1. Update component signature (line ~12)
Change:
```typescript
const FNTFinanceInvoiceForm: React.FC<FNTFinanceInvoiceFormProps> = ({ onClose }) => {
```
To:
```typescript
const FNTFinanceInvoiceForm: React.FC<FNTFinanceInvoiceFormProps> = ({ onClose, editInvoice }) => {
  const isEditMode = !!editInvoice;
```

### 2. Update loadingInvoiceNumber state (line ~15)
Change:
```typescript
const [loadingInvoiceNumber, setLoadingInvoiceNumber] = useState(true);
```
To:
```typescript
const [loadingInvoiceNumber, setLoadingInvoiceNumber] = useState(!editInvoice);
```

### 3. Add initialization function before formData state
```typescript
const getInitialFormData = () => {
  if (editInvoice && editInvoice.metadata) {
    const meta = editInvoice.metadata;
    return {
      invoiceNumber: editInvoice.invoice_number,
      invoiceDate: editInvoice.invoice_date,
      financeCompanyName: editInvoice.customer_name,
      financeCompanyPhone: editInvoice.customer_phone || '',
      financeCompanyEmail: editInvoice.customer_email || '',
      financeCompanyAddress: meta.finance_company_address || '',
      endCustomerName: meta.end_customer_name || '',
      vehMake: editInvoice.vehicle_make || '',
      vehModel: editInvoice.vehicle_model || '',
      vehReg: editInvoice.vehicle_reg || '',
      vehColour: meta.vehicle_colour || '',
      vehVin: meta.vehicle_vin || '',
      vehMileage: meta.vehicle_mileage || '',
      retailPrice: meta.retail_price || '',
      deliveryCost: meta.delivery_cost || '',
      warranty: meta.warranty || '',
      warrantyType: meta.warranty_type || '',
      depositPaid: meta.deposit_paid || '',
      totalDue: editInvoice.total_amount?.toString() || '',
      buyerSignature: meta.buyer_signature || ''
    };
  }
  return {
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    financeCompanyName: '',
    financeCompanyPhone: '',
    financeCompanyEmail: '',
    financeCompanyAddress: '',
    endCustomerName: '',
    vehMake: '',
    vehModel: '',
    vehReg: '',
    vehColour: '',
    vehVin: '',
    vehMileage: '',
    retailPrice: '',
    deliveryCost: '',
    warranty: '',
    warrantyType: '',
    depositPaid: '',
    totalDue: '',
    buyerSignature: ''
  };
};

const [formData, setFormData] = useState(getInitialFormData());
```

### 4. Update useEffect for invoice number (search for "Auto-generate invoice number")
Add condition:
```typescript
useEffect(() => {
  if (!isEditMode) {
    const loadInvoiceNumber = async () => {
      const invoiceNumber = await generateInvoiceNumber('fnt_finance');
      setFormData(prev => ({
        ...prev,
        invoiceNumber
      }));
      setLoadingInvoiceNumber(false);
    };
    loadInvoiceNumber();
  }
}, [isEditMode]);
```

### 5. Update save logic (search for "saveInvoiceToDatabase")
Replace:
```typescript
const saved = await saveInvoiceToDatabase(invoiceData);
if (!saved) {
  alert('Failed to save invoice to database...');
}
```
With:
```typescript
let saved;
if (isEditMode && editInvoice) {
  saved = await updateInvoiceInDatabase(editInvoice.id, invoiceData);
  if (!saved) {
    alert('Failed to update invoice in database...');
  }
} else {
  saved = await saveInvoiceToDatabase(invoiceData);
  if (!saved) {
    alert('Failed to save invoice to database...');
  }
}
```

### 6. Update success toast message
Change:
```typescript
showToast(`Invoice ${formData.invoiceNumber} generated and saved successfully!`, 'success');
```
To:
```typescript
showToast(
  `Invoice ${formData.invoiceNumber} ${isEditMode ? 'updated' : 'generated and saved'} successfully!`,
  'success'
);
```

### 7. Update header title (search for "FNT Finance Invoice")
Change:
```tsx
<h3 className="text-lg font-bold">FNT Finance Invoice</h3>
<p className="text-sm text-red-100">For billing finance companies</p>
```
To:
```tsx
<h3 className="text-lg font-bold">
  {isEditMode ? 'Edit FNT Finance Invoice' : 'FNT Finance Invoice'}
</h3>
<p className="text-sm text-red-100">
  {isEditMode ? `Editing invoice ${formData.invoiceNumber}` : 'For billing finance companies'}
</p>
```

### 8. Update button text (search for "Generate & Download Invoice")
Change:
```tsx
<span>Generate & Download Invoice</span>
```
To:
```tsx
<span>{isEditMode ? 'Update & Download Invoice' : 'Generate & Download Invoice'}</span>
```

## TNTInvoiceForm.tsx - Apply same pattern

Follow the EXACT same steps as FNTFinanceInvoiceForm, but:
- Replace 'fnt_finance' with 'tnt_service'
- Replace field names based on TNT form structure (customer vs finance company)
- Header text: "TNT Service Invoice" / "Edit TNT Service Invoice"

## InvoiceHistory.tsx - Add Edit Button

Add Edit button next to Download button around line 330:

```tsx
{/* Edit */}
<button
  onClick={() => handleEdit(invoice)}
  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition-colors"
  title="Edit invoice"
>
  <Edit className="w-4 h-4" />
</button>
```

Add state and handler at top of component:
```typescript
const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

const handleEdit = (invoice: Invoice) => {
  setEditingInvoice(invoice);
};
```

## InvoiceManager.tsx - Pass editInvoice prop

Update each form component call to pass editInvoice:
```tsx
{showFNTSaleForm && (
  <FNTSaleInvoiceForm 
    onClose={() => { setShowFNTSaleForm(false); setEditingInvoice(null); }} 
    editInvoice={editingInvoice}
  />
)}
```

Add to each form (Sale, Purchase, Finance, TNT).
