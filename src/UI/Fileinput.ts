export class FileInput {
    private input = document.createElement("input");

    constructor() {
        this.input.type = "file";
    }

    allowMultiple(value: boolean) {
        this.input.multiple = value;
    }
    setAcceptType(extensions?: string[]) {
        if (extensions) {
            this.input.accept = extensions.map(e => `.${e}`).join(", ");
        } else {
            this.input.accept = "";
        }
    }
    show() {
        return new Promise<FileList>((resolve, reject) => {
            const subs: (keyof WindowEventMap)[] = ["mousemove", "touchend"];
            const onCancel = () => {
                unCancel();
                reject(new Error("Not selected"));
            };
            const unCancel = () => {
                subs.forEach(s => window.removeEventListener(s, onCancel));
            };
            const frame = setTimeout(() => {
                subs.forEach(s => window.addEventListener(s, () => onCancel));
            }, 100);

            this.input.addEventListener("change", () => {
                clearTimeout(frame);
                unCancel();
                if (this.input.files) {
                    resolve(this.input.files);
                } else {
                    reject(new Error("Missing file"));
                }
            });

            this.input.click();
        });
    }
}
