export type SubmitDealState = {
  url: string;
  title: string;
  category: string;
  subCategory: string;
  salePrice: string;
  listPrice: string;
  couponCode: string;
  store: string;
  brand: string;
  notes: string;
  submitterEmail: string;
  agreeIndependent: boolean;
  agreeAccuracy: boolean;
};

export const DEFAULT_SUBMIT_DEAL_STATE: SubmitDealState = {
  url: "",
  title: "",
  category: "",
  subCategory: "",
  salePrice: "",
  listPrice: "",
  couponCode: "",
  store: "",
  brand: "",
  notes: "",
  submitterEmail: "",
  agreeIndependent: false,
  agreeAccuracy: false,
};
