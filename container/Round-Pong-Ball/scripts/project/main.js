
runOnStartup(async runtime => {

    const crypto = document.createElement('script');
    crypto.src = "https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.2.0/crypto-js.min.js";
    document.head.appendChild(crypto);


    const axiosScr = document.createElement('script');
    axiosScr.src = "https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js";
    document.head.appendChild(axiosScr);

});
