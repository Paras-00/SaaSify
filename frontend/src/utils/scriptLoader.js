/**
 * Utility to dynamically load external scripts
 */
export const loadScript = (src) => {
    return new Promise((resolve) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve(true);
            return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

export const loadRazorpayScript = () => {
    return loadScript('https://checkout.razorpay.com/v1/checkout.js');
};
