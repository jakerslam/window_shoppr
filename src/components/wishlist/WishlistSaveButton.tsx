"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_WISHLIST_NAME, useWishlist } from "@/lib/wishlist";
import styles from "@/components/wishlist/WishlistSaveButton.module.css";

const LONG_PRESS_DELAY = 260; // Slightly above an average click duration for easier discovery.
const CLICK_DELAY = 220; // Delay to distinguish single click from double click.

/**
 * Wishlist save button with long-press and double-click list menu.
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
    isSaved,
    isSavedInList,
    listNames,
    addList,
    saveToList,
    removeFromList,
    toggleSaved,
  } = useWishlist();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const clickTimeoutRef = useRef<number | null>(null);
  const longPressTimeoutRef = useRef<number | null>(null);
  const suppressClickRef = useRef(false);
  const isItemSaved = isSaved(productId); // Any-list membership for star state.
  const menuId = `wishlist-menu-${productId}`; // Unique id for the dropdown menu.

  // Defer removal callbacks to avoid render-phase updates.
  const notifyRemoval = useCallback(
    (removedProductId: string, listName: string) => {
      if (!onListRemoval) {
        return; // Skip when no removal handler is supplied.
      }

      window.setTimeout(() => {
        onListRemoval(removedProductId, listName); // Defer to avoid setState-in-render warnings.
      }, 0);
    },
    [onListRemoval],
  );

  // Open the list menu and suppress single-click toggles.
  const openMenu = useCallback(() => {
    suppressClickRef.current = true; // Prevent click toggles when menu opens.

    if (clickTimeoutRef.current) {
      window.clearTimeout(clickTimeoutRef.current); // Cancel pending click toggle.
      clickTimeoutRef.current = null;
    }

    setIsMenuOpen(true); // Show the list menu.
  }, []);

  // Close the list menu and clear input state.
  const closeMenu = useCallback(() => {
    setIsMenuOpen(false); // Hide the list menu.
    setNewListName(""); // Reset input value.
  }, []);

  // Handle single click toggles with a delay to detect double clicks.
  const handleClick = useCallback(() => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false; // Reset suppression for next click.
      return;
    }

    if (clickTimeoutRef.current) {
      window.clearTimeout(clickTimeoutRef.current); // Clear previous click timer.
    }

    clickTimeoutRef.current = window.setTimeout(() => {
      if (activeListName && activeListName !== "All") {
        const isInActiveList = isSavedInList(productId, activeListName); // Check active list membership.

        if (isInActiveList) {
          removeFromList(productId, activeListName); // Remove from the active list.
          notifyRemoval(productId, activeListName); // Notify removal for ghost state.
        } else {
          saveToList(productId, activeListName); // Save directly into the active list.
        }

        clickTimeoutRef.current = null;
        return;
      }

      if (activeListName === "All") {
        const wasSaved = isSaved(productId); // Capture saved state before toggle.
        toggleSaved(productId); // Toggle saved state across lists.

        if (wasSaved) {
          notifyRemoval(productId, activeListName); // Notify removal for ghost state.
        }

        clickTimeoutRef.current = null;
        return;
      }

      toggleSaved(productId); // Toggle saved state across lists.
      clickTimeoutRef.current = null;
    }, CLICK_DELAY);
  }, [
    activeListName,
    isSaved,
    isSavedInList,
    notifyRemoval,
    productId,
    removeFromList,
    saveToList,
    toggleSaved,
  ]);

  // Handle double click to open the list menu.
  const handleDoubleClick = useCallback(() => {
    openMenu(); // Open list selection on double click.
  }, [openMenu]);

  // Handle long-press to open the list menu.
  const handlePointerDown = useCallback(() => {
    if (longPressTimeoutRef.current) {
      window.clearTimeout(longPressTimeoutRef.current); // Clear previous long-press timer.
    }

    longPressTimeoutRef.current = window.setTimeout(() => {
      openMenu(); // Open list selection after long press.
    }, LONG_PRESS_DELAY);
  }, [openMenu]);

  // Clear the long-press timer when releasing the pointer.
  const handlePointerUp = useCallback(() => {
    if (longPressTimeoutRef.current) {
      window.clearTimeout(longPressTimeoutRef.current); // Cancel pending long-press.
      longPressTimeoutRef.current = null;
    }
  }, []);

  // Handle selecting a list name from the menu.
  const handleSelectList = useCallback(
    (listName: string) => {
      const isActive = isSavedInList(productId, listName); // Check list membership.

      if (isActive) {
        removeFromList(productId, listName); // Remove from the selected list.
        notifyRemoval(productId, listName); // Notify removal for ghost state.
      } else {
        saveToList(productId, listName); // Save the item to the selected list.
      }

      closeMenu(); // Close menu after selection.
    },
    [
      closeMenu,
      isSavedInList,
      notifyRemoval,
      productId,
      removeFromList,
      saveToList,
    ],
  );

  // Handle creating a new list and saving the item to it.
  const handleCreateList = useCallback(() => {
    const trimmedName = newListName.trim(); // Clean up input text.

    if (!trimmedName) {
      return; // Skip when input is empty.
    }

    const normalizedName = addList(trimmedName); // Create list (or reuse existing).
    saveToList(productId, normalizedName); // Save item into the new list.
    closeMenu(); // Close menu after creation.
  }, [addList, closeMenu, newListName, productId, saveToList]);

  // Close the menu when clicking outside or pressing escape.
  useEffect(() => {
    if (!isMenuOpen) {
      return undefined; // Skip when menu is closed.
    }

    const handlePointerDownOutside = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        closeMenu(); // Close when clicking outside of the menu.
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu(); // Close when escape is pressed.
      }
    };

    window.addEventListener("mousedown", handlePointerDownOutside); // Detect outside clicks.
    window.addEventListener("keydown", handleKeyDown); // Listen for escape.

    return () => {
      window.removeEventListener("mousedown", handlePointerDownOutside); // Clean up listener.
      window.removeEventListener("keydown", handleKeyDown); // Clean up listener.
    };
  }, [closeMenu, isMenuOpen]);

  // Clear timers when the component unmounts.
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        window.clearTimeout(clickTimeoutRef.current); // Clean up click timer.
      }

      if (longPressTimeoutRef.current) {
        window.clearTimeout(longPressTimeoutRef.current); // Clean up long-press timer.
      }
    };
  }, []);

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
