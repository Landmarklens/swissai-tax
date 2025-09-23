export function groupByStepAndInsights(data) {
  if (!data) {
    return;
  }

  const groupedData = data?.reduce((acc, item) => {
    const { step, insight } = item;

    // Skip if step or insight is undefined or null
    if (!step || !insight || !Array.isArray(insight)) return acc;

    // Initialize the step entry if it doesn't exist in the accumulator
    if (!acc[step]) {
      acc[step] = { step, insights: [] };
    }

    // Concatenate the current insight array to the insights array for the current step
    acc[step].insights = acc[step].insights.concat(insight);

    return acc;
  }, {});

  // Convert the grouped object to an array of objects
  return Object.values(groupedData);
}
