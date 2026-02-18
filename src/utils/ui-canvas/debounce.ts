export function debounce(func, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);      // Önceki zamanlayıcıyı temizle
        timer = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}