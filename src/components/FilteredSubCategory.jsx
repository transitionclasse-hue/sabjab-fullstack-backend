import React, { useState, useEffect } from 'react';
import { Label, Select, FormGroup, FormMessage } from '@adminjs/design-system';

/**
 * Custom SubCategory dropdown that filters by the selected Category.
 * Watches the `category` field on the Product form and fetches
 * only subcategories belonging to that category.
 */
const FilteredSubCategory = (props) => {
    const { property, record, onChange } = props;
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);

    // Get the currently selected category from the record
    const categoryId = record?.params?.category;
    // Get the currently selected subCategory
    const currentValue = record?.params?.subCategory;

    useEffect(() => {
        if (!categoryId) {
            setOptions([]);
            return;
        }

        setLoading(true);

        // Use the existing API route to fetch filtered subcategories
        fetch(`/api/categories/${categoryId}/subcategories`)
            .then(res => res.json())
            .then(result => {
                const items = result.data || result || [];
                const opts = (Array.isArray(items) ? items : []).map(sc => ({
                    value: sc._id,
                    label: sc.name,
                }));
                setOptions(opts);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch subcategories:', err);
                setOptions([]);
                setLoading(false);
            });
    }, [categoryId]);

    const selected = options.find(o => o.value === currentValue) || null;

    const handleChange = (selectedOption) => {
        onChange(property.path, selectedOption ? selectedOption.value : '');
    };

    return (
        <FormGroup>
            <Label>Sub Category</Label>
            {!categoryId ? (
                <FormMessage>Please select a Category first</FormMessage>
            ) : loading ? (
                <FormMessage>Loading subcategories...</FormMessage>
            ) : options.length === 0 ? (
                <FormMessage>No subcategories found for this category</FormMessage>
            ) : (
                <Select
                    value={selected}
                    options={options}
                    onChange={handleChange}
                    isClearable
                    placeholder="Select Sub Category..."
                />
            )}
        </FormGroup>
    );
};

export default FilteredSubCategory;
