const ids = [716071, 663242, 453597, 404198, 507508, 25241, 480500];

const patterns = [
  id => `https://cdn.grofers.com/app/images/products/full_screen/pro_${id}.jpg`,
  id => `https://cdn.grofers.com/app/images/products/sliding_image/${id}a.jpg`,
  id => `https://cdn.grofers.com/app/images/products/sliding_image/${id}b.jpg`,
  id => `https://cdn.grofers.com/app/images/products/sliding_image/${id}c.jpg`,
  id => `https://cdn.grofers.com/app/images/products/large/large_${id}_0.jpg`,
  id => `https://cdn.grofers.com/app/images/products/large/large_${id}_1.jpg`,
  id => `https://cdn.grofers.com/app/images/products/large/pro_${id}_0.jpg`,
  id => `https://cdn.grofers.com/app/images/products/full_screen/pro_${id}_0.jpg`,
  id => `https://cdn.grofers.com/app/images/products/full_screen/pro_${id}_1.jpg`,
  id => `https://cdn.grofers.com/app/images/products/full_screen/${id}.jpg`,
  id => `https://cdn.grofers.com/app/images/products/full_screen/${id}a.jpg`
];

async function check(url) {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.status === 200;
  } catch (err) {
    return false;
  }
}

async function testAll() {
  for (const id of ids) {
    console.log(`Testing ID ${id}:`);
    let found = false;
    for (const pattern of patterns) {
      const url = pattern(id);
      const ok = await check(url);
      if (ok) {
        console.log(`  ✅ FOUND: ${url}`);
        found = true;
      }
    }
    if (!found) {
      console.log(`  ❌ No pattern worked for ID ${id}`);
    }
  }
}

testAll().catch(console.error);
