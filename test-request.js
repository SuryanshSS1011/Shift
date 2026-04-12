const testData = {
    model: "gemini-pro",
    tokenCount: 1500,
    region: "us-west"
};

async function test() {
    try {
        const response = await fetch('http://localhost:3000/calculate-cost', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        });

        const data = await response.json();
        console.log('Response from server:');
        console.log(JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error during test:', error.message);
    }
}

test();
