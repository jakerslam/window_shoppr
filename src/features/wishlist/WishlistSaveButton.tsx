"use client";

import { useCallback, useEffect, useState } from "react";
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
  openMenuOnMobileTap = false,
  enableListMenu = true,
}: {
  productId: string;
  buttonClassName: string;
  savedClassName?: string;
  activeListName?: string;
  onListRemoval?: (productId: string, listName: string) => void;
  wrapperClassName?: string;
  openMenuOnMobileTap?: boolean;
  enableListMenu?: boolean;
}) {
  const {
    DEFAULT_WISHLIST_NAME,
    isItemSaved,
    isMenuOpen,
    listNames,
    listSummaries,
    deleteList,
    isSavedInList,
    newListName,
    setNewListName,
    wrapperRef,
    menuId,
    closeMenu,
    handleClick,
    handleDoubleClick,
    handleSelectList,
    handleCreateList,
  } = useWishlistMenu({
    productId,
    activeListName,
    onListRemoval,
    openMenuOnMobileTap,
    enableListMenu,
  });
  const [isManagerOpen, setIsManagerOpen] = useState(false);

  /**
   * Open the list manager modal from the save menu.
   */
  const handleOpenManager = useCallback(() => {
    closeMenu(); // Close dropdown before showing the modal.
    setIsManagerOpen(true); // Show list manager modal.
  }, [closeMenu]);

  /**
   * Close the list manager modal.
   */
  const handleCloseManager = useCallback(() => {
    setIsManagerOpen(false); // Hide list manager modal.
  }, []);

  /**
   * Delete a custom list after explicit confirmation.
   */
  const handleDeleteList = useCallback(
    (listName: string) => {
      if (listName === DEFAULT_WISHLIST_NAME) {
        return; // Protect the default list from deletion.
      }

      const shouldDelete = window.confirm(
        `Delete "${listName}"? Items only in this list will be unsaved.`,
      );
      if (!shouldDelete) {
        return; // Keep list when deletion is canceled.
      }

      deleteList(listName); // Remove the selected list.
    },
    [DEFAULT_WISHLIST_NAME, deleteList],
  );

  /**
   * Support escape key to close the manager modal.
   */
  useEffect(() => {
    if (!isManagerOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsManagerOpen(false); // Close on Escape key press.
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isManagerOpen]);

  return (
    <>
      <div
        ref={wrapperRef}
        className={`${styles.wishlistSave} ${wrapperClassName ?? ""}`}
        onClick={(event) => event.stopPropagation()} // Prevent card clicks.
      >
        {/* Save button with click and double-click support. */}
        <button
          className={`${styles.wishlistSave__button} ${buttonClassName} ${
            isItemSaved && savedClassName ? savedClassName : ""
          }`}
          type="button"
          aria-pressed={isItemSaved}
          aria-label={
            isItemSaved ? "Remove from wishlist" : "Save to wishlist"
          }
          aria-haspopup={enableListMenu ? "menu" : undefined}
          aria-expanded={enableListMenu ? isMenuOpen : undefined}
          aria-controls={enableListMenu ? menuId : undefined}
          onClick={handleClick} // Toggle wishlist on click.
          onDoubleClick={enableListMenu ? handleDoubleClick : undefined} // Open list menu on double click when enabled.
        >
          <span className={styles.wishlistSave__icon}>{isItemSaved ? "★" : "☆"}</span>
        </button>

        {/* Dropdown menu for list selection and creation. */}
        {isMenuOpen && enableListMenu ? (
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

            {/* Open modal list manager from menu. */}
            <button
              className={styles.wishlistSave__manage}
              type="button"
              role="menuitem"
              onClick={handleOpenManager} // Launch list manager modal.
            >
              Manage lists
            </button>
          </div>
        ) : null}
      </div>

      {/* List manager modal for viewing and deleting lists. */}
      {isManagerOpen ? (
        <div
          className={styles.wishlistSave__managerBackdrop}
          role="presentation"
          onClick={handleCloseManager} // Close when backdrop is clicked.
        >
          <section
            className={styles.wishlistSave__manager}
            role="dialog"
            aria-modal="true"
            aria-labelledby="wishlist-manager-title"
            onClick={(event) => event.stopPropagation()} // Keep clicks inside modal.
          >
            <header className={styles.wishlistSave__managerHeader}>
              <h2 id="wishlist-manager-title" className={styles.wishlistSave__managerTitle}>
                Manage lists
              </h2>
              <button
                className={styles.wishlistSave__managerClose}
                type="button"
                onClick={handleCloseManager} // Close modal.
                aria-label="Close list manager"
              >
                ✕
              </button>
            </header>

            <div className={styles.wishlistSave__managerList}>
              {listSummaries.map((list) => (
                <div key={list.name} className={styles.wishlistSave__managerItem}>
                  <div className={styles.wishlistSave__managerMeta}>
                    <span className={styles.wishlistSave__managerName}>{list.name}</span>
                    <span className={styles.wishlistSave__managerCount}>
                      {list.count} item{list.count === 1 ? "" : "s"}
                    </span>
                  </div>

                  {list.isDefault ? (
                    <span className={styles.wishlistSave__managerTag}>Default</span>
                  ) : (
                    <button
                      className={styles.wishlistSave__managerDelete}
                      type="button"
                      onClick={() => handleDeleteList(list.name)} // Delete custom list.
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              className={styles.wishlistSave__managerDone}
              type="button"
              onClick={handleCloseManager} // Dismiss modal.
            >
              Done
            </button>
          </section>
        </div>
      ) : null}
    </>
  );
}
