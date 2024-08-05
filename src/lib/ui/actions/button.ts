export function loading(button: HTMLButtonElement, loading: boolean) {
    button.classList.toggle('loading', loading);
    button.disabled = loading;

    return {
        update() {
            button.classList.toggle('loading', loading);
            button.disabled = loading
        },
        destroy() {
            button.classList.remove('loading');
            button.disabled = false;
        }
    };
}