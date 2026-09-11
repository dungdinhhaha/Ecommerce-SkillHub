const CART_KEY = "skillhubCart";

export const getCartItems = () => {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  } catch {
    return [];
  }
};

export const saveCartItems = (items) => {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("skillhub-cart-updated"));
};

export const addCartItem = (gig) => {
  const items = getCartItems();
  const item = {
    _id: gig._id,
    title: gig.title,
    cover: gig.cover,
    price: gig.promotion?.finalPrice || gig.salePrice || gig.price,
    originalPrice: gig.price,
    listingType: gig.listingType,
    seller: gig.userId?.username || "Talent SkillHub",
    addedAt: new Date().toISOString(),
  };
  const exists = items.some((cartItem) => cartItem._id === item._id);
  const nextItems = exists ? items.map((cartItem) => cartItem._id === item._id ? item : cartItem) : [item, ...items];
  saveCartItems(nextItems);
  return { exists, items: nextItems };
};

export const removeCartItem = (id) => {
  const nextItems = getCartItems().filter((item) => item._id !== id);
  saveCartItems(nextItems);
  return nextItems;
};

export const clearCart = () => saveCartItems([]);
