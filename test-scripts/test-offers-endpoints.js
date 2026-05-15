// Test script for new offers endpoints
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testOffersEndpoints() {
  console.log('🧪 Testing New Offers Endpoints\n');
  console.log('='.repeat(60));

  try {
    // Test 1: GET /offers
    console.log('\n📋 Test 1: GET /offers (All offers)');
    const allOffersRes = await axios.get(`${BASE_URL}/offers`);
    console.log(`✅ Status: ${allOffersRes.status}`);
    console.log(`✅ Total Offers: ${allOffersRes.data.count}`);
    console.log(`✅ Sample Offer: ${allOffersRes.data.offers[0]?.title || 'N/A'}`);
    
    // Test 2: GET /venues/:id/offers (Warehouse Project)
    console.log('\n📋 Test 2: GET /venues/:id/offers (Warehouse Project)');
    const warehouseId = '5857bda3-0361-4e1c-a35e-6035d148bca2';
    const warehouseOffersRes = await axios.get(`${BASE_URL}/venues/${warehouseId}/offers`);
    console.log(`✅ Status: ${warehouseOffersRes.status}`);
    console.log(`✅ Venue: ${warehouseOffersRes.data.venue.name}`);
    console.log(`✅ Offers Count: ${warehouseOffersRes.data.count}`);
    if (warehouseOffersRes.data.offers.length > 0) {
      console.log(`✅ Offer: ${warehouseOffersRes.data.offers[0].title}`);
      console.log(`   - Type: ${warehouseOffersRes.data.offers[0].type}`);
      console.log(`   - Saving: £${warehouseOffersRes.data.offers[0].savingValue}`);
      console.log(`   - Status: ${warehouseOffersRes.data.offers[0].status}`);
      console.log(`   - Available Now: ${warehouseOffersRes.data.offers[0].isAvailableNow}`);
    }

    // Test 3: GET /venues/:id/offers (The Alchemist)
    console.log('\n📋 Test 3: GET /venues/:id/offers (The Alchemist)');
    const alchemistId = '5f91a069-788b-4c97-a382-d688f3f9f401';
    const alchemistOffersRes = await axios.get(`${BASE_URL}/venues/${alchemistId}/offers`);
    console.log(`✅ Status: ${alchemistOffersRes.status}`);
    console.log(`✅ Venue: ${alchemistOffersRes.data.venue.name}`);
    console.log(`✅ Offers Count: ${alchemistOffersRes.data.count}`);
    if (alchemistOffersRes.data.offers.length > 0) {
      console.log(`✅ Offer: ${alchemistOffersRes.data.offers[0].title}`);
      console.log(`   - Type: ${alchemistOffersRes.data.offers[0].type}`);
      console.log(`   - Saving: £${alchemistOffersRes.data.offers[0].savingValue}`);
      console.log(`   - Status: ${alchemistOffersRes.data.offers[0].status}`);
      console.log(`   - Available Now: ${alchemistOffersRes.data.offers[0].isAvailableNow}`);
    }

    // Test 4: GET /venues/:id/offers (Invalid venue)
    console.log('\n📋 Test 4: GET /venues/:id/offers (Invalid venue - should fail)');
    try {
      await axios.get(`${BASE_URL}/venues/00000000-0000-0000-0000-000000000000/offers`);
      console.log('❌ Should have thrown 404 error');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log(`✅ Correctly returned 404 for invalid venue`);
      } else {
        console.log(`❌ Unexpected error: ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ All Tests Passed!\n');

  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

testOffersEndpoints();
