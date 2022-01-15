const arrayIntersection = (target: Array<any>, compare: Array<any>) => {
  const targetSet = new Set(target);
  const compareSet = new Set(compare);

  return [...new Set([...targetSet].filter((x) => compareSet.has(x)))];
};

export default arrayIntersection;
