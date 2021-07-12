import ArtText from '@/artText';
import ArtRender from '..';
import EventCenter from '@/eventCenter';
import Editor from '@/editor';
import Message from '@/plugins/message';
import { installShortcutKey } from './shortcutKey';
import { win } from '@/config';
import { installTableTool } from '../tool/tableTool';
import Cursor, { Position } from '../cursor';
import { externalDomToMd } from '../interaction/conversion';

/**
 * 渲染器的事件类
 */
export default class ArtRenderEvent {

    artRender: ArtRender;
    /**是否连续输入，如中文输入时，多个摁键代表一个中文 */
    isComposition: boolean = false;
    DOMEvents: string[] = [];
    customizeEvents: [string, Function][] = [];
    constructor(artRender: ArtRender) {
        this.artRender = artRender;
    }

    /**添加所有事件 */
    public attachAllEvent() {
        this.artRender.dom.onmousedown = function (evt) {
            // console.log(evt);

        }
        this.artRender.dom.setAttribute('contenteditable', 'true');

        const artRender = this.artRender;
        installShortcutKey(this);
        installTableTool(this);
        this.addCustomizeEvent('MoreTableTool.open', detail => {
            artRender.tableMoreTool.open(artRender, detail);
            return false;
        })
        this.addCustomizeEvent('DOM.click', () => {
            artRender.artText.get<EventCenter>("$eventCenter").emit("floatAuxiliaryTool.close");
            artRender.tableMoreTool.close();
        });
        this.addCustomizeEvent('DOM.mousewheel', () => {
            artRender.artText.get<EventCenter>("$eventCenter").emit("floatAuxiliaryTool.close");
            artRender.tableMoreTool.close();
        });

        this.addDOMEvent('keydown', this.keydown);
        this.addDOMEvent('keyup', this.keyup);

        // 连续输开始
        this.addDOMEvent('compositionstart', (e: CompositionEvent, _this: ArtRenderEvent) => { _this.isComposition = true; });
        // 连续输结束
        this.addDOMEvent('compositionend', (e: CompositionEvent, _this: ArtRenderEvent) => { _this.isComposition = false; });

        this.addDOMEvent('click', this.click);
        this.addDOMEvent('contextmenu', this.contextmenu);

        const eventCenter = this.artRender.artText.get<EventCenter>('$eventCenter');
        this.artRender.artText.get<EventCenter>('$eventCenter').attachDOMEvent(document.body, 'mousewheel', e => eventCenter.emit('DOM.' + e.type));

        this.addDOMEvent('paste', this.paste);
        this.addDOMEvent("copy", this.copy);

        this.addDOMEvent('drop', this.drop);
        // this.ondrag
    }

    /**移除所有事件 */
    public detachAllEvent() {
        for (let customize of this.customizeEvents) {
            this.artRender.artText.get<EventCenter>('$eventCenter').off(...customize);
        }

        for (let id of this.DOMEvents) {
            this.artRender.artText.get<EventCenter>('$eventCenter').detachDOMEvent(id);
        }
        this.customizeEvents = [];
        this.DOMEvents = [];
        this.artRender.dom.setAttribute('contenteditable', 'false');
    }

    /**添加dom事件 */
    private addDOMEvent(type: string, fun: Function): void {
        const _this = this;
        function closure(e) {
            _this.artRender.artText.get<EventCenter>('$eventCenter').emit('DOM.' + e.type);
            return fun(e, _this);
        }

        let id = this.artRender.artText.get<EventCenter>('$eventCenter').attachDOMEvent(this.artRender.dom, type, closure);
        this.DOMEvents.push(id);
    }

    /**添加自定义事件 */
    addCustomizeEvent(type: string, listener: Function): void {
        this.artRender.artText.get<EventCenter>('$eventCenter').on(type, listener);
        this.customizeEvents.push([type, listener]);
    }



    /**摁键摁下行为 */
    public keydown(e: KeyboardEvent, _this: ArtRenderEvent): boolean {
        let key: string = e.key;
        if (_this.shortcutKey(e, _this.artRender.artText)) {
            // 是否摁下快捷键
            e.preventDefault();
            return false;
        } else if (/^Arrow(Right|Left|Up|Down)$/.test(key) && _this.artRender.cursor.moveCursor(key)) {
            e.preventDefault();
            return false;
        } else if (!_this.isComposition && !_this.artRender.interaction.render(key, "keydown")) {
            e.preventDefault();
            return false;
        }
        return true;
    }

    // 快捷键
    private shortcutKey(e: KeyboardEvent, artText: ArtText): boolean {
        if (e.ctrlKey) {
            return artText.get<EventCenter>("$eventCenter").emit("art-ShortcutKey-Control+" + e.key);
        }
        return false;
    }

    /**摁键抬起行为 */
    private keyup(e: KeyboardEvent, _this: ArtRenderEvent) {
        let key: string = e.key;

        if (key == 'Backspace') {
            if (_this.artRender.dom.innerHTML == '') {
                // html编辑器为空时
                _this.artRender.dom.innerHTML = '<p><br/></p>';
            }
        }
        if (!_this.isComposition) {
            return _this.artRender.interaction.render(key, 'keyup', e);
        }
        return true;
    }

    /**左点击 */
    private click(e: MouseEvent, _this: ArtRenderEvent) {
        let dom = e.target as HTMLAnchorElement;
        if (e.altKey && dom.nodeName == "A") {
            //window.location.href=node.href;
            let url;
            if (dom.getAttribute("href") === "#") {
                let ref = dom.getAttribute("art-data-ref");
                if (_this.artRender.refmap.has(ref))
                    url = _this.artRender.refmap.get(ref).destination;
                else
                    return;
            } else {
                url = dom.href;
            }
            window.open(url);
        } else {
            let cursor = _this.artRender.cursor;
            cursor.getSelection();
            cursor.setSelection();
        }
    }

    /**右点击 */
    private contextmenu(e: MouseEvent, _this: ArtRenderEvent) {
        e.preventDefault();
        _this.artRender.artText.get<EventCenter>("$eventCenter").emit("floatAuxiliaryTool.open", e.clientX, e.clientY);
    }

    /**复制 */
    private copy(e: ClipboardEvent, _this: ArtRenderEvent) {
        let md = _this.artRender.getSelectNodeMd();
        e.clipboardData.setData("text/markdown", md);
    }

    /**贴贴行为 */
    private paste(e: ClipboardEvent, _this: ArtRenderEvent) {
        if (!(e.clipboardData && e.clipboardData.items)) {
            return;
        }
        _this.artRender.cursor.getSelection();
        let pos = _this.artRender.cursor.pos;
        let node = _this.artRender.doc.firstChild, i = pos.rowAnchorOffset;
        while (--i > -1) {
            node = node.next;
        }
        let text: string;
        console.log(e.clipboardData)
        if (text = e.clipboardData.getData("text/markdown2")) {
            console.log(text, node);
            let pos = _this.artRender.cursor.pos;
            if (pos.selection.isCollapsed) {
                if (pos.rowNode.nodeName === "PRE")
                    return true;

                console.log(text);
                let doc = _this.artRender.interaction.parser.parse(text);
                _this.artRender.interaction.parser.parser.refmap.forEach((value, key) => {
                    _this.artRender.refmap.set(key, value);
                });

                let child = doc.lastChild, prev;
                while (child) {
                    prev = child.prev;
                    _this.artRender.operation.insertAfter(child, node);
                    child = prev;
                }

                _this.artRender.operation.update();
                return false;
            } else {
                return false;
            }

        } else if (text = e.clipboardData.getData("text/html")) {
        
            let html: HTMLHtmlElement = document.createElement('html');
            html.innerHTML = text;
            let body = html.childNodes[1] as HTMLElement;
            let md = externalDomToMd(body);
            console.log(text, body, md);
            let doc = _this.artRender.interaction.parser.parse(md);
            _this.artRender.interaction.parser.parser.refmap.forEach((value, key) => {
                _this.artRender.refmap.set(key, value);
            });

            let child = doc.lastChild, prev;
            while (child) {
                prev = child.prev;
                _this.artRender.operation.insertAfter(child, node);
                child = prev;
            }

            _this.artRender.operation.update();
            e.preventDefault();
            return false;
        } else if (text = e.clipboardData.getData("text/plain")) {
            console.log(text);
            return false;
        }
    }

    /**剪贴 */
    private cut(e: ClipboardEvent, _this: ArtRenderEvent) {
        _this.copy(e, _this);
        _this.artRender.deleteSelectNode();
        e.preventDefault();
        return false;
    }

    /**
     * 拖事件
     */
    private drop(e: DragEvent, _this: ArtRenderEvent) {
        e.preventDefault();
        for (let i = 0, len = e.dataTransfer.files.length; i < len; i++) {
            let f0 = e.dataTransfer.files[i];
            let fr = new FileReader();

            if (/.*\.md$/.test(f0.name) || f0.type == 'text/plain') {
                // 加载文本
                fr.onload = () => {
                    if (fr.result) {
                        _this.artRender.artText.get<Editor>('$editor').openFile({ defaultMd: fr.result.toString(), name: f0.name });
                    }
                };
                fr.readAsText(f0);
            } else if (/^image\/(png|jpe?g)$/.test(f0.type)) {
                console.log(f0, fr)
                const closure = function (url: string, name: string) {


                    let img = new Image();
                    img.src = url;

                    let span = document.createElement('span');
                    span.setAttribute('class', 'art-hide');
                    let text = new Text('![' + name + '](' + url + ')');
                    span.appendChild(text);
                    const target = e.target as HTMLElement;

                    target.appendChild(text);
                    //target.appendChild(img);

                    _this.artRender.interaction.render(null, "keyup");
                }

                _this.artRender.artText.get<EventCenter>('$eventCenter').emit("art-uploadImage", [f0, closure]);


            } else {
                _this.artRender.artText.get<Message>('message').create('不支持该文件类型', 'error');
            }
        }
    }
}