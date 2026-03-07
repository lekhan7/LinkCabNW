// Test the error detection logic
const testErrorMessage = 'invalid input syntax for type uuid: "{"success" : …ng_id" : "16dfa631-e41a-4fd5-b00f-b163ee02ad44"}"';

const hasUUIDError = (testErrorMessage?.includes('invalid input syntax for type uuid'));

console.log('Error message:', testErrorMessage);
console.log('Has UUID error:', hasUUIDError);
console.log('Contains "invalid input syntax":', testErrorMessage.includes('invalid input syntax for type uuid'));
