const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const API_URL = 'http://localhost:5000/api';

const runVerification = async () => {
    try {
        console.log('--- Full Lifecycle Verification Started ---');

        // Credentials from seedTestEnvironment.js
        const farmerCreds = { email: 'farmer@verify.com', password: 'Test1234' };
        const officerCreds = { email: 'finance@verify.com', password: 'Test1234' };

        // 1. Farmer Login
        console.log('1. Logging in as Farmer...');
        const farmerLogin = await axios.post(`${API_URL}/auth/login`, farmerCreds);
        const farmerToken = farmerLogin.data.token;
        const farmerAscId = farmerLogin.data.assignedAsc?._id || farmerLogin.data.assignedAsc;
        console.log('✅ Farmer logged in');

        // 2. Fetch Crops
        console.log('2. Fetching Farmer crops...');
        const cropsRes = await axios.get(`${API_URL}/crops`, {
            headers: { Authorization: `Bearer ${farmerToken}` }
        });
        const crop = cropsRes.data.find(c => c.status === 'APPROVED');
        if (!crop) throw new Error("No approved crop found for farmer");
        console.log(`✅ Found approved crop: ${crop.cropType}`);

        // 3. Submit Claim
        console.log('3. Submitting Compensation Claim...');
        const claimPayload = {
            crop: crop._id,
            damageType: 'flood',
            incidentDate: '2026-02-18',
            affectedArea: 2.5,
            damageDescription: 'Field submerged due to heavy rainfall.',
            asc: farmerAscId
        };
        const claimRes = await axios.post(`${API_URL}/compensation`, claimPayload, {
            headers: { Authorization: `Bearer ${farmerToken}` }
        });
        const claimId = claimRes.data.claim._id;
        console.log(`✅ Claim submitted! ID: ${claimId}`);

        // 4. Officer Login
        console.log('4. Logging in as Financial Officer...');
        const officerLogin = await axios.post(`${API_URL}/auth/login`, officerCreds);
        const officerToken = officerLogin.data.token;
        console.log('✅ Officer logged in');

        // 5. Fetch Regional Claims (Officer View)
        console.log('5. Fetching regional claims as Officer...');
        const officerClaimsRes = await axios.get(`${API_URL}/compensation`, {
            headers: { Authorization: `Bearer ${officerToken}` }
        });
        const foundClaim = officerClaimsRes.data.find(c => c._id === claimId);
        if (!foundClaim) throw new Error("Claim not found in officer's regional list");
        console.log('✅ Claim found in officer list');

        // 6. Officer Estimates and Approves
        console.log('6. Officer updating claim with estimation and approval...');
        const patchData = {
            estimatedLoss: 75000,
            status: 'APPROVED'
        };
        const updateRes = await axios.patch(`${API_URL}/compensation/${claimId}`, patchData, {
            headers: { Authorization: `Bearer ${officerToken}` }
        });
        console.log('✅ Claim updated by officer');

        // 7. Verify Farmer History
        console.log('7. Verifying updated status in Farmer History...');
        const farmerClaimsRes = await axios.get(`${API_URL}/compensation`, {
            headers: { Authorization: `Bearer ${farmerToken}` }
        });
        const updatedClaim = farmerClaimsRes.data.find(c => c._id === claimId);

        console.log(`--- Results ---`);
        console.log(`Status: ${updatedClaim.status} (Expected: APPROVED)`);
        console.log(`Estimated Loss: LKR ${updatedClaim.estimatedLoss} (Expected: 75000)`);

        if (updatedClaim.status === 'APPROVED' && updatedClaim.estimatedLoss === 75000) {
            console.log('\n✅ COMPLETED: Full lifecycle verification successful!');
            process.exit(0);
        } else {
            console.log('\n❌ FAILED: Status or Estimation mismatch');
            process.exit(1);
        }

    } catch (error) {
        console.error('\n❌ Verification failed:', error.response?.data?.message || error.message);
        process.exit(1);
    }
};

runVerification();
