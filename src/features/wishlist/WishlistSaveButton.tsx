"use client";

import useWishlistMenu from "@/features/wishlist/useWishlistMenu";
import styles from "@/features/wishlist/WishlistSaveButton.module.css";

/**
 * Wishlist save button with list menu controls.
 */
export default function WishlistSaveButton({
  productId,
  buttonClassName,
  savedClassName,
  activeListName,
  onListRemoval,
  wrapperClassName,
}: {
  productId: string;
  buttonClassName: string;
  savedClassName?: string;
  activeListName?: string;
  onListRemoval?: (productId: string, listName: string) => void;
  wrapperClassName?: string;
}) {
  const {
    DEFAULT_WISHLIST_NAME,
    isItemSaved,
    isMenuOpen,
    listNames,
    isSavedInList,
    newListName,
    setNewListName,
    wrapperRef,
    menuId,
    handleClick,
    handleDoubleClick,
    handlePointerDown,
    handlePointerUp,
    handleSelectList,
    handleCreateList,
  } = useWishlistMenu({
    productId,
    activeListName,
    onListRemoval,
  });

  return (
    <div
      ref={wrapperRef}
      className={`${styles.wishlistSave} ${wrapperClassName ?? ""}`}
      onClick={(event) => event.stopPropagation()} // Prevent card clicks.
    >
      {/* Save button with long-press and double-click support. */}
      <button
        className={`${styles.wishlistSave__button} ${buttonClassName} ${
          isItemSaved && savedClassName ? savedClassName : ""
        }`}
        type="button"
        aria-pressed={isItemSaved}
        aria-label={
          isItemSaved ? "Remove from wishlist" : "Save to wishlist"
        }
        aria-haspopup="menu"
        aria-expanded={isMenuOpen}
        aria-controls={menuId}
        onClick={handleClick} // Toggle wishlist on click.
        onDoubleClick={handleDoubleClick} // Open list menu on double click.
        onPointerDown={handlePointerDown} // Start long press timer.
        onPointerUp={handlePointerUp} // Clear long press timer.
        onPointerLeave={handlePointerUp} // Clear timer when pointer leaves.
        onPointerCancel={handlePointerUp} // Clear timer on cancel.
      >
        <span className={styles.wishlistSave__icon}>{isItemSaved ? "★" : "☆"}</span>
      </button>

      {/* Dropdown menu for list selection and creation. */}
      {isMenuOpen ? (
        <div
          id={menuId}
          className={styles.wishlistSave__menu}
          role="menu"
          onClick={(event) => event.stopPropagation()} // Keep menu clicks local.
        >
          {/* Existing wishlist options. */}
          <div className={styles.wishlistSave__menuList}>
            {listNames.map((listName) => {
              const isDefault = listName === DEFAULT_WISHLIST_NAME; // Identify default list.
              const isActive = isSavedInList(productId, listName); // Check list membership.

              return (
                <button
                  key={listName}
                  className={`${styles.wishlistSave__menuItem} ${
                    isDefault ? styles["wishlistSave__menuItem--default"] : ""
                  } ${
                    isActive ? styles["wishlistSave__menuItem--active"] : ""
                  }`}
                  type="button"
                  role="menuitem"
                  onClick={() => handleSelectList(listName)} // Save/remove with list selection.
                >
                  <span>{listName}</span>
                  {isActive ? (
                    <span className={styles.wishlistSave__menuCheck}>✓</span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Create new list input row. */}
          <div className={styles.wishlistSave__createRow}>
            <input
              className={styles.wishlistSave__createInput}
              type="text"
              value={newListName}
              onChange={(event) => setNewListName(event.target.value)} // Update input state.
              placeholder="create new list"
              aria-label="Create new list"
            />
            <button
              className={styles.wishlistSave__createButton}
              type="button"
              role="menuitem"
              onClick={handleCreateList} // Create list and save item.
              aria-label="Add list"
            >
              +
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
