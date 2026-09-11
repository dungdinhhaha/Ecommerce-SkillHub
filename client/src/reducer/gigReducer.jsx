export const INIT_STATE = {
  userId: JSON.parse(localStorage.getItem("currentUser"))?._id,
  title: "",
  cat: "",
  cover: "",
  images: [],
  description: "",
  shortTitle: "",
  shortDesc: "",
  deliveryTime: 0,
  revisionNumber: 0,
  features: [],
  price: 0,
  listingType: "skill_service",
  digitalFileUrl: "",
  digitalFileName: "",
};

export const gigReducer = (state, action) => {
  switch (action.type) {
    case "CHANGE_INPUT":
      return {
        ...state,
        [action.payload.name]: action.payload.value,
      };
    case "ADD_IMAGES":
      return {
        ...state,
        cover: action.payload.cover,
        images: action.payload.images,
        digitalFileUrl: action.payload.digitalFileUrl || state.digitalFileUrl,
        digitalFileName: action.payload.digitalFileName || state.digitalFileName,
      };
    case "ADD_FEATURE":
      if (!action.payload || state.features.includes(action.payload)) return state;
      return { ...state, features: [...state.features, action.payload] };
    case "REMOVE_FEATURE":
      return {
        ...state,
        features: state.features.filter((feat) => feat != action.payload),
      };
    default:
      return state;
  }
};
