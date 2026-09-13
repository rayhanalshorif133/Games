const sendScore = async (score) => {
    // Laravel এর meta tag থেকে CSRF টোকেন সংগ্রহ
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
    console.log("token");
    const finalScore = (typeof score === 'object' && score !== null) ? (score.score ?? 0) : score;

    try {
        const response = await axios.post('/api/score', { score: finalScore }, {
            headers: {
                'X-CSRF-TOKEN': csrfToken,
                'Content-Type': 'application/json'
            },
            withCredentials: true
        });

        console.log('✅ Score sent successfully:', response.data);
        return response.data;

    } catch (error) {
        console.error('❌ Error sending score:', error.response?.data || error.message);
    }
};

// গ্লোবাল অ্যাক্সেস নিশ্চিত করা
if (typeof window !== 'undefined') {
    window.sendScore = sendScore;
}
if (typeof globalThis !== 'undefined') {
    globalThis.sendScore = sendScore;
}
