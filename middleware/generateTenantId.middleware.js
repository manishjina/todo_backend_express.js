const { v4: uuidv4 } = require('uuid');

function generateTenantId() {
  const prefix = 'tenant_';
  const uniqueId = uuidv4().replace(/-/g, ''); // Remove dashes from UUID

  console.log(prefix + uniqueId)
  return prefix + uniqueId;
}


module.exports={generateTenantId}