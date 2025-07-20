// Test script to verify Multnomah County zip code validation
const DELIVERY_ZONES = {
  cityName: "Portland Multnomah County",
  stateName: "Oregon",
  allowedZipCodes: [
    '97201', '97202', '97203', '97204', '97205', '97206', '97207', '97208', '97209',
    '97210', '97211', '97212', '97213', '97214', '97215', '97216', '97217', '97218',
    '97219', '97220', '97221', '97222', '97223', '97224', '97225', '97227', '97228',
    '97229', '97230', '97231', '97232', '97233', '97236', '97238', '97239', '97240',
    '97242', '97266', '97267', '97268', '97269', '97280', '97281', '97282', '97283',
    '97286', '97290', '97291', '97292', '97293', '97294', '97296', '97298', '97299'
  ],
};

const validateZipCode = (zip) => {
  return DELIVERY_ZONES.allowedZipCodes.includes(zip.trim());
};

// Test cases
const testZipCodes = [
  '97201', // Portland - should be valid
  '97211', // Portland - should be valid
  '97225', // Portland - should be valid
  '97299', // Portland - should be valid
  '12345', // Random - should be invalid
  '90210', // Beverly Hills - should be invalid
  '10001', // New York - should be invalid
  '97201 ', // Portland with space - should be valid (trimmed)
  ' 97211 ', // Portland with spaces - should be valid (trimmed)
];

console.log('Testing Multnomah County ZIP code validation:');
console.log('=============================================');

testZipCodes.forEach(zip => {
  const isValid = validateZipCode(zip);
  console.log(`${zip}: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
});

console.log('\nSummary:');
console.log(`- Total allowed ZIP codes: ${DELIVERY_ZONES.allowedZipCodes.length}`);
console.log(`- Valid test cases: ${testZipCodes.filter(zip => validateZipCode(zip)).length}`);
console.log(`- Invalid test cases: ${testZipCodes.filter(zip => !validateZipCode(zip)).length}`); 