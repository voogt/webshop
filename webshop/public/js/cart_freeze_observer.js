// Remove freeze overlay if it exists
function removeFreezeElement() {
    const freezeElement = document.getElementById('freeze');
    if (freezeElement) {
        freezeElement.remove();
    }
}

// Only create observer if not already present
if (!window.__cartFreezeObserverInitialized) {
    // Create an observer instance linked to the callback function
    const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                removeFreezeElement();
            }
        }
    });

    // Options for the observer (which mutations to observe)
    const config = { childList: true, subtree: true };

    // Start observing the document body for configured mutations
    observer.observe(document.body, config);

    // Initial check in case the element already exists when the script runs
    removeFreezeElement();

    // Mark as initialized to prevent redeclaration
    window.__cartFreezeObserverInitialized = true;
}
