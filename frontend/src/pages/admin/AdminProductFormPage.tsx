import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { adminApi } from '../../api';
import type { Category, Product } from '../../types';
import { Spinner } from '../../components/Shared';
import toast from 'react-hot-toast';

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  originalPrice: string;
  categoryId: string;
  status: string;
  tags: string;
}

export default function AdminProductFormPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [categories, setCategories] = useState<Category[]>([]);
  const [existingImages, setExistingImages] = useState<Product['images']>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [removeImageIds, setRemoveImageIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);

  const { register, control, handleSubmit, formState: { errors }, reset } = useForm<ProductFormData>({
    defaultValues: { status: 'ACTIVE', price: '', originalPrice: '', tags: '' },
  });

  const descriptionModules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ align: [] }],
      ['link', 'clean'],
    ],
  };

  const descriptionFormats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'list',
    'bullet',
    'align',
    'link',
  ];

  useEffect(() => {
    adminApi.getCategories().then(({ data }) => {
      if (data.data) setCategories(data.data);
    }).catch(() => {});

    if (id) {
      adminApi.getProducts({ search: '', page: 1, limit: 1 }).catch(() => {});
      // Fetch single product via slug or listing — we need to find by id
      adminApi.getProducts({ page: 1, limit: 100 }).then(({ data }) => {
        if (data.data) {
          const product = data.data.items.find((p) => p.id === id);
          if (product) {
            reset({
              name: product.name,
              description: product.description,
              price: product.price.toString(),
              originalPrice: product.originalPrice?.toString() ?? '',
              categoryId: product.categoryId,
              status: product.status,
              tags: product.tags.join(', '),
            });
            setExistingImages(product.images);
          }
        }
        setFetching(false);
      }).catch(() => setFetching(false));
    }
  }, [id, reset]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setNewFiles((prev) => [...prev, ...files].slice(0, 10));
    }
  };

  const handleRemoveExisting = (imgId: string) => {
    setRemoveImageIds((prev) => [...prev, imgId]);
    setExistingImages((prev) => prev.filter((img) => img.id !== imgId));
  };

  const handleRemoveNew = (index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (formData: ProductFormData) => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', formData.name);
      fd.append('description', formData.description);
      fd.append('price', formData.price);
      if (formData.originalPrice) fd.append('originalPrice', formData.originalPrice);
      fd.append('categoryId', formData.categoryId);
      fd.append('status', formData.status);
      fd.append('tags', formData.tags);

      if (removeImageIds.length > 0) fd.append('removeImageIds', JSON.stringify(removeImageIds));

      newFiles.forEach((file) => fd.append('images', file));

      if (isEditing && id) {
        await adminApi.updateProduct(id, fd);
        toast.success('Product updated');
      } else {
        await adminApi.createProduct(fd);
        toast.success('Product created');
      }
      navigate('/admin/products');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error ?? 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-surface-900 mb-8">{isEditing ? 'Edit Product' : 'Add Product'}</h1>
      <div className="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="card p-6 space-y-5">
            <div>
              <label htmlFor="prod-name" className="block text-sm font-medium text-surface-700 mb-2">Product Name</label>
              <input id="prod-name" type="text" className="input-field" placeholder="Product name" {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Min 2 characters' } })} />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label htmlFor="prod-desc" className="block text-sm font-medium text-surface-700 mb-2">Description</label>
              <Controller
                name="description"
                control={control}
                rules={{
                  required: 'Description is required',
                  validate: (value) => {
                    const plainText = value.replace(/<(.|\n)*?>/g, '').trim();
                    return plainText.length > 0 || 'Description is required';
                  },
                }}
                render={({ field }) => (
                  <ReactQuill
                    id="prod-desc"
                    theme="snow"
                    value={field.value}
                    onChange={field.onChange}
                    modules={descriptionModules}
                    formats={descriptionFormats}
                    placeholder="Write product description"
                    className="bg-white rounded-xl"
                  />
                )}
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="prod-price" className="block text-sm font-medium text-surface-700 mb-2">Price (₹)</label>
                <input id="prod-price" type="number" step="0.01" className="input-field" placeholder="999" {...register('price', { required: 'Price is required' })} />
                {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>}
              </div>
              <div>
                <label htmlFor="prod-original-price" className="block text-sm font-medium text-surface-700 mb-2">Original Price (₹, optional)</label>
                <input id="prod-original-price" type="number" step="0.01" className="input-field" placeholder="1999" {...register('originalPrice')} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="prod-category" className="block text-sm font-medium text-surface-700 mb-2">Category</label>
                <select id="prod-category" className="input-field" {...register('categoryId', { required: 'Category is required' })}>
                  <option value="">Select category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {errors.categoryId && <p className="text-red-500 text-sm mt-1">{errors.categoryId.message}</p>}
              </div>
              <div>
                <label htmlFor="prod-status" className="block text-sm font-medium text-surface-700 mb-2">Status</label>
                <select id="prod-status" className="input-field" {...register('status')}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="OUT_OF_STOCK">Out of Stock</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="prod-tags" className="block text-sm font-medium text-surface-700 mb-2">Tags (comma-separated)</label>
              <input id="prod-tags" type="text" className="input-field" placeholder="tag1, tag2, tag3" {...register('tags')} />
            </div>
          </div>

          {/* Images */}
          <div className="card p-6">
            <h3 className="font-semibold text-surface-900 mb-4">Product Images</h3>

            {existingImages.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-4">
                {existingImages.map((img) => (
                  <div key={img.id} className="relative group">
                    <img src={img.url} alt="Product" className="w-20 h-20 rounded-xl object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x600/EEE/999?text=No+Image'; }} />
                    {img.isPrimary && <span className="absolute -top-1 -left-1 bg-primary-600 text-white text-[10px] px-1.5 py-0.5 rounded-md font-bold">Primary</span>}
                    <button type="button" onClick={() => handleRemoveExisting(img.id)} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                  </div>
                ))}
              </div>
            )}

            {newFiles.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-4">
                {newFiles.map((file, i) => (
                  <div key={i} className="relative group">
                    <img src={URL.createObjectURL(file)} alt={`New ${i + 1}`} className="w-20 h-20 rounded-xl object-cover" />
                    <button type="button" onClick={() => handleRemoveNew(i)} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                  </div>
                ))}
              </div>
            )}

            <label className="block border-2 border-dashed border-surface-200 rounded-xl p-6 text-center cursor-pointer hover:border-primary-400 transition-colors">
              <svg className="w-8 h-8 mx-auto text-surface-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <p className="text-sm text-surface-500">Click to upload images (JPG, PNG, WebP · Max 5MB each · Max 10 images)</p>
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleFileChange} className="hidden" />
            </label>
          </div>

          <div className="flex gap-3">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <Spinner size="sm" /> : isEditing ? 'Update Product' : 'Create Product'}
            </button>
            <button type="button" onClick={() => navigate('/admin/products')} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
