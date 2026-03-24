import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api';
import type { Category } from '../../types';
import { Spinner, EmptyState, Modal } from '../../components/Shared';
import toast from 'react-hot-toast';

export default function AdminCategoriesPage(): React.ReactElement {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [reassignId, setReassignId] = useState('');
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);

  const fetchCategories = () => {
    setLoading(true);
    adminApi.getCategories().then(({ data }) => {
      if (data.data) setCategories(data.data);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', name.trim());
      if (iconFile) fd.append('icon', iconFile);

      if (editingId) {
        await adminApi.updateCategory(editingId, fd);
        toast.success('Category updated');
      } else {
        await adminApi.createCategory(fd);
        toast.success('Category created');
      }
      setModalOpen(false);
      setName('');
      setIconFile(null);
      setEditingId(null);
      fetchCategories();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error ?? 'Failed to save category');
    } finally { setSaving(false); }
  };

  const openEdit = (cat: Category) => {
    setEditingId(cat.id);
    setName(cat.name);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await adminApi.deleteCategory(deleteId, reassignId || undefined);
      toast.success('Category deleted');
      setDeleteId(null);
      setDeleteCategory(null);
      setReassignId('');
      fetchCategories();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error ?? 'Failed to delete');
    }
  };

  const startDelete = (cat: Category) => {
    setDeleteCategory(cat);
    setDeleteId(cat.id);
    if (cat._count && cat._count.products > 0) {
      // Need reassignment
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-surface-900">Categories</h1>
        <button onClick={() => { setEditingId(null); setName(''); setModalOpen(true); }} className="btn-primary text-sm">+ Add Category</button>
      </div>

      {categories.length === 0 ? (
        <EmptyState title="No categories" message="Create your first category to organize products." action={{ label: 'Add Category', onClick: () => { setEditingId(null); setName(''); setModalOpen(true); } }} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className="card p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {cat.iconUrl ? (
                  <img src={cat.iconUrl} alt={cat.name} className="w-10 h-10 rounded-lg object-contain" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-xl">🏷️</div>
                )}
                <div>
                  <h3 className="font-semibold text-surface-900">{cat.name}</h3>
                  <p className="text-xs text-surface-400">{cat._count?.products ?? 0} products</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(cat)} className="text-primary-600 text-xs font-medium min-w-[44px] min-h-[44px] flex items-center justify-center">Edit</button>
                <button onClick={() => startDelete(cat)} className="text-red-600 text-xs font-medium min-w-[44px] min-h-[44px] flex items-center justify-center">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Category' : 'Add Category'} maxWidth="max-w-sm">
        <div className="space-y-4">
          <div>
            <label htmlFor="cat-name" className="block text-sm font-medium text-surface-700 mb-2">Category Name</label>
            <input id="cat-name" type="text" className="input-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-2">Icon (optional)</label>
            <input type="file" accept="image/*" onChange={(e) => setIconFile(e.target.files?.[0] ?? null)} className="input-field text-sm" />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} className="btn-primary" disabled={saving}>
              {saving ? <Spinner size="sm" /> : 'Save'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete with reassignment */}
      {deleteCategory && (
        <Modal isOpen={!!deleteId} onClose={() => { setDeleteId(null); setDeleteCategory(null); }} title="Delete Category" maxWidth="max-w-sm">
          <div className="space-y-4">
            {deleteCategory._count && deleteCategory._count.products > 0 ? (
              <>
                <p className="text-surface-600 text-sm">
                  This category has <strong>{deleteCategory._count.products}</strong> product(s). Please choose a category to reassign them to:
                </p>
                <select className="input-field" value={reassignId} onChange={(e) => setReassignId(e.target.value)}>
                  <option value="">Select category</option>
                  {categories.filter((c) => c.id !== deleteId).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => { setDeleteId(null); setDeleteCategory(null); }} className="btn-secondary">Cancel</button>
                  <button onClick={handleDelete} className="btn-danger" disabled={!reassignId}>Delete & Reassign</button>
                </div>
              </>
            ) : (
              <>
                <p className="text-surface-600 text-sm">Are you sure you want to delete &ldquo;{deleteCategory.name}&rdquo;?</p>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => { setDeleteId(null); setDeleteCategory(null); }} className="btn-secondary">Cancel</button>
                  <button onClick={handleDelete} className="btn-danger">Delete</button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
