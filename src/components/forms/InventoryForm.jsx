import { useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import InputField from './InputField';
import { validateInventoryForm } from '../../utils';

/**
 * InventoryForm component - Form for adding/editing inventory items
 * Includes custom metadata support for power users
 */
const InventoryForm = ({ initialData = {}, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    category: initialData.category || '',
    warehouse: initialData.stock?.warehouse || 0,
    store: initialData.stock?.store || 0,
    safetyStock: initialData.safetyStock || 0,
    cost: initialData.cost || 0,
    price: initialData.price || 0,
    vendor: initialData.vendor || ''
  });

  // Custom metadata state - allows arbitrary key-value pairs
  const [metadata, setMetadata] = useState(
    initialData.metadata || []
  );

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newValue = ['warehouse', 'store', 'safetyStock', 'cost', 'price'].includes(name)
      ? parseFloat(value) || 0
      : value;

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));

    // Validate on blur
    const validationErrors = validateInventoryForm(formData);
    if (validationErrors[name]) {
      setErrors(prev => ({ ...prev, [name]: validationErrors[name] }));
    }
  };

  // Metadata handlers
  const addMetadataField = () => {
    setMetadata([...metadata, { key: '', value: '' }]);
  };

  const updateMetadataField = (index, field, value) => {
    const newMetadata = [...metadata];
    newMetadata[index][field] = value;
    setMetadata(newMetadata);
  };

  const removeMetadataField = (index) => {
    setMetadata(metadata.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate all fields
    const validationErrors = validateInventoryForm(formData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setTouched({
        name: true,
        category: true,
        vendor: true,
        cost: true,
        price: true,
        warehouse: true,
        store: true,
        safetyStock: true
      });
      return;
    }

    // Filter out empty metadata entries and include in submission
    const validMetadata = metadata.filter(m => m.key.trim() !== '');
    onSubmit({ ...formData, metadata: validMetadata });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <InputField
        label="Product Name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.name && errors.name}
      />

      <div className="grid grid-cols-2 gap-4">
        <InputField
          label="Category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.category && errors.category}
        />
        <InputField
          label="Vendor"
          name="vendor"
          value={formData.vendor}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.vendor && errors.vendor}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <InputField
          label="Cost ($)"
          name="cost"
          type="number"
          step="0.01"
          min="0"
          value={formData.cost}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.cost && errors.cost}
        />
        <InputField
          label="Price ($)"
          name="price"
          type="number"
          step="0.01"
          min="0"
          value={formData.price}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.price && errors.price}
        />
      </div>

      <div className="p-4 bg-slate-50 rounded-lg space-y-4 border border-slate-100">
        <h4 className="text-sm font-bold text-slate-700">Stock Levels</h4>
        <div className="grid grid-cols-3 gap-3">
          <InputField
            label="Warehouse"
            name="warehouse"
            type="number"
            min="0"
            value={formData.warehouse}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.warehouse && errors.warehouse}
          />
          <InputField
            label="Store"
            name="store"
            type="number"
            min="0"
            value={formData.store}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.store && errors.store}
          />
          <InputField
            label="Safety Stock"
            name="safetyStock"
            type="number"
            min="0"
            value={formData.safetyStock}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.safetyStock && errors.safetyStock}
          />
        </div>
      </div>

      {/* Custom Metadata Section */}
      <div className="p-4 bg-indigo-50/50 rounded-lg border border-indigo-100 space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="text-sm font-bold text-slate-700">Custom Fields (Metadata)</h4>
            <p className="text-xs text-slate-500 mt-0.5">Add custom attributes like Bin Location, Color, Expiry Date, etc.</p>
          </div>
          <button
            type="button"
            onClick={addMetadataField}
            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 rounded hover:bg-indigo-100 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Field
          </button>
        </div>

        {metadata.length > 0 ? (
          <div className="space-y-2">
            {metadata.map((field, index) => (
              <div key={index} className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Key (e.g. Color)"
                  className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  value={field.key}
                  onChange={(e) => updateMetadataField(index, 'key', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Value (e.g. Red)"
                  className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  value={field.value}
                  onChange={(e) => updateMetadataField(index, 'value', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeMetadataField(index)}
                  className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                  title="Remove field"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic text-center py-3">
            No custom fields added. Click "Add Field" to create one.
          </p>
        )}
      </div>

      {Object.keys(errors).length > 0 && touched.name && (
        <p className="text-sm text-red-600 text-center">
          Please fix the errors above before submitting.
        </p>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800"
        >
          Save Changes
        </button>
      </div>
    </form>
  );
};

export default InventoryForm;
