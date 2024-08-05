export function loading(element: HTMLElement, loading: boolean) {

    let originalDisabled = element.getAttribute('disabled');

    let update = (loading: boolean) => {
        element.classList.toggle('loading', loading);

        if (element instanceof HTMLButtonElement) {
            element.disabled = loading;
        }
    }

    update(loading);

    return {
        update,
        destroy() {
            element.classList.remove('loading');

            if (originalDisabled) {
                element.setAttribute('disabled', originalDisabled);
            }
        }
    };
}