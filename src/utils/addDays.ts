const addDays = (days, date = "") => {
  const res = date ? new Date(date) : new Date();

  res.setDate(res.getDate() + days);

  return res;
};

export default addDays;
