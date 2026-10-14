import { useState, type FormEvent } from 'react';
import { useCategories } from '../../hooks/useCategories';
import type { Category } from '../../types/database';

interface CategoryManagerProps {
  /** Callback được gọi khi danh mục được thêm, sửa hoặc xóa để các component khác đồng bộ */
  onCategoriesChange?: () => void;
}

// Bảng gợi ý emoji phổ biến cho quản lý tài chính
const POPULAR_EMOJIS = [
  '🍔', '☕', '🛒', '🚗', '🏠', '🎮',
  '🏥', '📚', '✈️', '💰', '💼', '🎁',
  '⚡', '🏋️', '🍿', '🐾', '💄', '💡'
];

/**
 * Component quản lý CRUD danh mục chi tiêu / thu nhập (CategoryManager)
 */
export function CategoryManager({ onCategoriesChange }: CategoryManagerProps) {
  const {
    categories,
    loading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    reassignAndDeleteCategory,
    checkCategoryReferences,
  } = useCategories();

  // State cho Form Thêm Danh Mục mới
  const [name, setName] = useState('');
  const [color, setColor] = useState('#10B981');
  const [icon, setIcon] = useState('📁');
  const [isAdding, setIsAdding] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // State chỉnh sửa danh mục
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('#10B981');
  const [editIcon, setEditIcon] = useState('📁');
  const [isUpdating, setIsUpdating] = useState(false);

  // State modal xóa & kiểm tra tham chiếu giao dịch
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [referencedCount, setReferencedCount] = useState<number | null>(null);
  const [replacementCategoryId, setReplacementCategoryId] = useState<string>('');
  const [isCheckingRef, setIsCheckingRef] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  /**
   * Xử lý Thêm danh mục
   */
  const handleAddSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    const trimmed = name.trim();
    if (!trimmed) {
      setFormError('Vui lòng nhập tên danh mục.');
      return;
    }

    setIsAdding(true);
    const result = await addCategory({
      name: trimmed,
      color,
      icon: icon.trim() || '📁',
    });
    setIsAdding(false);

    if (result.error) {
      setFormError(result.error);
    } else {
      setSuccessMessage(`Đã thêm danh mục "${trimmed}" thành công!`);
      setName('');
      setColor('#10B981');
      setIcon('📁');
      onCategoriesChange?.();
      setTimeout(() => setSuccessMessage(null), 3500);
    }
  };

  /**
   * Bắt đầu sửa danh mục
   */
  const startEditing = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditColor(cat.color || '#10B981');
    setEditIcon(cat.icon || '📁');
    setFormError(null);
  };

  /**
   * Hủy sửa danh mục
   */
  const cancelEditing = () => {
    setEditingId(null);
    setEditName('');
    setEditColor('#10B981');
    setEditIcon('📁');
  };

  /**
   * Lưu thay đổi danh mục
   */
  const handleUpdateSave = async (id: string) => {
    const trimmed = editName.trim();
    if (!trimmed) {
      setFormError('Tên danh mục không được để trống.');
      return;
    }

    setIsUpdating(true);
    const result = await updateCategory(id, {
      name: trimmed,
      color: editColor,
      icon: editIcon.trim() || '📁',
    });
    setIsUpdating(false);

    if (result.error) {
      setFormError(result.error);
    } else {
      setSuccessMessage(`Đã cập nhật danh mục "${trimmed}"!`);
      cancelEditing();
      onCategoriesChange?.();
      setTimeout(() => setSuccessMessage(null), 3500);
    }
  };

  /**
   * Mở hộp thoại xóa danh mục và kiểm tra các giao dịch đang tham chiếu
   */
  const openDeleteModal = async (cat: Category) => {
    setDeleteTarget(cat);
    setDeleteError(null);
    setReplacementCategoryId('');
    setIsCheckingRef(true);
    setReferencedCount(null);

    const count = await checkCategoryReferences(cat.id);
    setReferencedCount(count);
    setIsCheckingRef(false);
  };

  /**
   * Đóng hộp thoại xóa
   */
  const closeDeleteModal = () => {
    setDeleteTarget(null);
    setReferencedCount(null);
    setDeleteError(null);
    setReplacementCategoryId('');
  };

  /**
   * Xác nhận xóa danh mục khi không có giao dịch tham chiếu
   */
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    setDeleteError(null);

    const result = await deleteCategory(deleteTarget.id);
    setIsDeleting(false);

    if (!result.success) {
      setDeleteError(result.error || 'Không thể xóa danh mục.');
      if (result.referencedCount !== undefined) {
        setReferencedCount(result.referencedCount);
      }
    } else {
      setSuccessMessage(`Đã xóa danh mục "${deleteTarget.name}".`);
      closeDeleteModal();
      onCategoriesChange?.();
      setTimeout(() => setSuccessMessage(null), 3500);
    }
  };

  /**
   * Chuyển toàn bộ giao dịch sang danh mục mới rồi xóa danh mục cũ
   */
  const handleReassignAndDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    setDeleteError(null);

    const repId = replacementCategoryId || null;
    const result = await reassignAndDeleteCategory(deleteTarget.id, repId);
    setIsDeleting(false);

    if (!result.success) {
      setDeleteError(result.error || 'Lỗi khi chuyển đổi và xóa.');
    } else {
      setSuccessMessage(`Đã chuyển đổi giao dịch và xóa danh mục "${deleteTarget.name}".`);
      closeDeleteModal();
      onCategoriesChange?.();
      setTimeout(() => setSuccessMessage(null), 3500);
    }
  };

  // Các danh mục khác dùng làm phương án thay thế
  const otherCategories = categories.filter((c) => c.id !== deleteTarget?.id);

  return (
    <div className="mm-card mm-category-manager-card">
      <div className="mm-card-header">
        <div className="mm-tx-header-title">
          <span className="mm-header-icon">📁</span>
          <h3>Quản Lý Danh Mục</h3>
        </div>
        <span className="mm-badge badge-info">{categories.length} danh mục</span>
      </div>

      {/* Thông báo thông tin & lỗi */}
      {successMessage && (
        <div className="mm-alert mm-alert-success" role="alert" style={{ marginBottom: '1rem' }}>
          <span className="mm-alert-icon">✅</span>
          <div className="mm-alert-content">{successMessage}</div>
        </div>
      )}

      {(formError || error) && (
        <div className="mm-alert mm-alert-error" role="alert" style={{ marginBottom: '1rem' }}>
          <span className="mm-alert-icon">⚠️</span>
          <div className="mm-alert-content">{formError || error}</div>
        </div>
      )}

      {/* 1. Form thêm mới danh mục */}
      <div className="mm-cat-add-section">
        <h4 className="mm-cat-subtitle">➕ Thêm Danh Mục Mới</h4>
        <form className="mm-cat-form" onSubmit={handleAddSubmit}>
          <div className="mm-cat-form-row">
            {/* Tên danh mục */}
            <div className="mm-form-group mm-cat-flex-name">
              <label htmlFor="cat-name" className="mm-form-label">
                Tên danh mục <span className="text-danger">*</span>
              </label>
              <input
                id="cat-name"
                type="text"
                className="mm-input"
                placeholder="Ví dụ: Ăn uống, Tiền điện..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isAdding}
                required
              />
            </div>

            {/* Màu sắc: input type="color" */}
            <div className="mm-form-group mm-cat-flex-color">
              <label htmlFor="cat-color" className="mm-form-label">
                Màu sắc
              </label>
              <div className="mm-color-input-wrapper">
                <input
                  id="cat-color"
                  type="color"
                  className="mm-color-picker"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  disabled={isAdding}
                />
                <span className="mm-color-code">{color.toUpperCase()}</span>
              </div>
            </div>

            {/* Icon: emoji */}
            <div className="mm-form-group mm-cat-flex-icon">
              <label htmlFor="cat-icon" className="mm-form-label">
                Biểu tượng (Emoji)
              </label>
              <input
                id="cat-icon"
                type="text"
                className="mm-input mm-emoji-input"
                placeholder="📁"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                maxLength={4}
                disabled={isAdding}
              />
            </div>
          </div>

          {/* Gợi ý chọn nhanh emoji */}
          <div className="mm-cat-emoji-palette">
            <span className="mm-palette-label">Gợi ý emoji:</span>
            <div className="mm-emoji-list">
              {POPULAR_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className={`mm-emoji-pill ${icon === emoji ? 'active' : ''}`}
                  onClick={() => setIcon(emoji)}
                  title={`Chọn emoji ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="mm-btn mm-btn-primary mm-cat-submit-btn"
            disabled={isAdding || !name.trim()}
          >
            {isAdding ? '⏳ Đang lưu...' : '➕ Thêm Danh Mục'}
          </button>
        </form>
      </div>

      <hr className="mm-divider" />

      {/* 2. Danh sách danh mục (List danh mục của user, order by name) */}
      <div className="mm-cat-list-section">
        <h4 className="mm-cat-subtitle">📋 Danh Sách Của Bạn (A - Z)</h4>

        {loading && categories.length === 0 ? (
          <div className="mm-tx-empty-state">
            <span className="mm-spinner"></span>
            <p>Đang tải danh mục...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="mm-tx-empty-state">
            <span className="mm-empty-icon">📁</span>
            <h4>Chưa có danh mục nào</h4>
            <p>Hãy thêm danh mục đầu tiên của bạn ở biểu mẫu bên trên.</p>
          </div>
        ) : (
          <ul className="mm-cat-items-list">
            {categories.map((cat) => {
              const isEditing = editingId === cat.id;
              const catColor = cat.color || '#10B981';

              if (isEditing) {
                return (
                  <li key={cat.id} className="mm-cat-item mm-cat-item-editing">
                    <div className="mm-cat-edit-form">
                      <div className="mm-cat-edit-inputs">
                        <input
                          type="text"
                          className="mm-input mm-cat-inline-name"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Tên danh mục"
                          required
                        />
                        <div className="mm-color-input-wrapper">
                          <input
                            type="color"
                            className="mm-color-picker"
                            value={editColor}
                            onChange={(e) => setEditColor(e.target.value)}
                          />
                        </div>
                        <input
                          type="text"
                          className="mm-input mm-emoji-input"
                          value={editIcon}
                          onChange={(e) => setEditIcon(e.target.value)}
                          maxLength={4}
                        />
                      </div>
                      <div className="mm-cat-edit-actions">
                        <button
                          type="button"
                          className="mm-btn mm-btn-sm mm-btn-outline"
                          onClick={cancelEditing}
                          disabled={isUpdating}
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          className="mm-btn mm-btn-sm mm-btn-primary"
                          onClick={() => handleUpdateSave(cat.id)}
                          disabled={isUpdating || !editName.trim()}
                        >
                          {isUpdating ? 'Lưu...' : 'Lưu'}
                        </button>
                      </div>
                    </div>
                  </li>
                );
              }

              return (
                <li key={cat.id} className="mm-cat-item">
                  <div className="mm-cat-item-left">
                    <div
                      className="mm-cat-icon-badge"
                      style={{
                        backgroundColor: `${catColor}20`,
                        color: catColor,
                        borderColor: `${catColor}50`,
                      }}
                    >
                      {cat.icon || '📁'}
                    </div>
                    <div className="mm-cat-item-details">
                      <span className="mm-cat-name">{cat.name}</span>
                      <span className="mm-cat-color-dot" style={{ backgroundColor: catColor }} title={catColor} />
                    </div>
                  </div>

                  <div className="mm-cat-item-right">
                    <button
                      type="button"
                      className="mm-action-btn mm-edit-btn"
                      title="Sửa danh mục"
                      onClick={() => startEditing(cat)}
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      className="mm-action-btn mm-delete-btn"
                      title="Xóa danh mục"
                      onClick={() => openDeleteModal(cat)}
                    >
                      🗑️
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* 3. Modal xác nhận xóa danh mục (Bảo vệ: không xóa cứng khi có giao dịch tham chiếu) */}
      {deleteTarget && (
        <div className="mm-modal-backdrop" role="dialog" aria-modal="true">
          <div className="mm-modal-container mm-confirm-modal">
            <div className="mm-modal-header">
              <div className="mm-modal-title-row">
                <span className="mm-modal-icon-danger">⚠️</span>
                <h3>Xóa Danh Mục "{deleteTarget.name}"</h3>
              </div>
              <button
                type="button"
                className="mm-modal-close-btn"
                onClick={closeDeleteModal}
                disabled={isDeleting}
              >
                ✕
              </button>
            </div>

            <div className="mm-modal-body">
              {isCheckingRef ? (
                <div style={{ textAlign: 'center', padding: '1.5rem' }}>
                  <span className="mm-spinner"></span>
                  <p style={{ marginTop: '0.75rem', color: '#64748b' }}>
                    Đang kiểm tra giao dịch liên kết...
                  </p>
                </div>
              ) : referencedCount !== null && referencedCount > 0 ? (
                /* Có giao dịch tham chiếu: KHÔNG xóa cứng, báo lỗi và gợi ý đổi danh mục */
                <div className="mm-cat-blocked-delete">
                  <div className="mm-alert mm-alert-error" role="alert">
                    <span className="mm-alert-icon">🚫</span>
                    <div className="mm-alert-content">
                      <strong>Không thể xóa cứng danh mục này!</strong>
                      <p>
                        Hiện đang có <strong>{referencedCount} giao dịch</strong> trong sổ thu chi đang tham chiếu
                        đến danh mục <strong>"{deleteTarget.name}"</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="mm-cat-reassign-box">
                    <p className="mm-cat-reassign-prompt">
                      💡 <strong>Gợi ý:</strong> Bạn có thể chuyển toàn bộ <strong>{referencedCount} giao dịch</strong> sang
                      danh mục khác dưới đây trước khi tiến hành xóa:
                    </p>

                    <div className="mm-form-group">
                      <label htmlFor="rep-cat" className="mm-form-label">
                        Chọn danh mục thay thế:
                      </label>
                      <select
                        id="rep-cat"
                        className="mm-input mm-select"
                        value={replacementCategoryId}
                        onChange={(e) => setReplacementCategoryId(e.target.value)}
                        disabled={isDeleting}
                      >
                        <option value="">-- Chuyển thành "Không có danh mục" --</option>
                        {otherCategories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.icon ? `${c.icon} ` : '📁 '} {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                /* Không có giao dịch nào tham chiếu: Có thể an toàn xóa */
                <p className="mm-confirm-desc">
                  Bạn có chắc chắn muốn xóa danh mục <strong>"{deleteTarget.name}"</strong> không?
                  Danh mục này hiện chưa có giao dịch nào tham chiếu và sẽ được xóa vĩnh viễn.
                </p>
              )}

              {deleteError && (
                <div className="mm-alert mm-alert-error" role="alert" style={{ marginTop: '1rem' }}>
                  <span className="mm-alert-icon">⚠️</span>
                  <div className="mm-alert-content">{deleteError}</div>
                </div>
              )}
            </div>

            <div className="mm-modal-footer">
              <button
                type="button"
                className="mm-btn mm-btn-outline"
                onClick={closeDeleteModal}
                disabled={isDeleting}
              >
                Hủy Bỏ
              </button>

              {referencedCount !== null && referencedCount > 0 ? (
                /* Nút chuyển đổi giao dịch rồi xóa */
                <button
                  type="button"
                  className="mm-btn mm-btn-danger"
                  onClick={handleReassignAndDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <span className="mm-btn-spinner-text">
                      <span className="mm-spinner"></span> Đang chuyển đổi &amp; xóa...
                    </span>
                  ) : (
                    '🔄 Chuyển Giao Dịch & Xóa Danh Mục'
                  )}
                </button>
              ) : (
                /* Nút xóa trực tiếp */
                <button
                  type="button"
                  className="mm-btn mm-btn-danger"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting || isCheckingRef}
                >
                  {isDeleting ? (
                    <span className="mm-btn-spinner-text">
                      <span className="mm-spinner"></span> Đang xóa...
                    </span>
                  ) : (
                    '🗑️ Xác Nhận Xóa'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
