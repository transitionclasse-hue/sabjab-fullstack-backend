import React, { useState, useEffect } from 'react';
import { Label, Select, FormGroup, FormMessage } from '@adminjs/design-system';

/**
 * Custom Category dropdown that filters by the selected SuperCategory.
 */
const FilteredCategory = (props) => {
    const { property, record, onChange } = props;
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);

    // Get the currently selected superCategory from the record
    const superCategoryId = record?.params?.superCategory;
    // Get the currently selected category
    const currentValue = record?.params?.category;

    useEffect(() => {
        if (!superCategoryId) {
            setOptions([]);
            return;
        }

        setLoading(true);

        // Fetch categories filtered by the selected superCategory
        fetch(`/api/supercategories/${superCategoryId}/categories`)
            .then(res => res.json())
            .then(result => {
                const items = result.data || result || [];
                const opts = (Array.isArray(items) ? items : []).map(cat => ({
                    value: cat._id,
                    label: cat.name,
                }));
                setOptions(opts);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch categories:', err);
                setOptions([]);
                setLoading(false);
            });
    }, [superCategoryId]);

    const selected = options.find(o => o.value === currentValue) || null;

    const handleChange = (selectedOption) => {
        onChange(property.path, selectedOption ? selectedOption.value : '');
        // Reset category-dependent fields if necessary
        // Here we might want to clear subCategory if category changes, 
        // but that's handled by the subCategory component watching category.
    };

    return (
        <FormGroup>
            <Label>Category</Label>
            {!superCategoryId ? (
                <FormMessage>Please select a Super Category first</FormMessage>
            ) : loading ? (
                <FormMessage>Loading categories...</FormMessage>
            ) : options.length === 0 ? (
                <FormMessage>No categories found for this super category</FormMessage>
            ) : (
                <Select
                    value={selected}
                    options={options}
                    onChange={handleChange}
                    isClearable
                    placeholder="Select Category..."
                />
            )}
        </FormGroup>
    );
};

export default FilteredCategory;
