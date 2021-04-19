import * as common from "./common";
import fromCodePoint from "./from-code-point";
//import { decodeHTML } from "entities";
//import "string.prototype.repeat"; // Polyfill for String.prototype.repeat
import VNode from "../node";

var normalizeURI = common.normalizeURI;
var unescapeString = common.unescapeString;

// Constants for character codes: # 字符代码常量:

/**换行键 */
const C_NEWLINE = 10;
/**星号 * */
const C_ASTERISK = 42;
/**下划线 _ */
const C_UNDERSCORE = 95;
/**开单引号 ` */
const C_BACKTICK = 96;
/**开方括号 [ */
const C_OPEN_BRACKET = 91;
/**闭方括号 ] */
const C_CLOSE_BRACKET = 93;
/**小于 < */
const C_LESSTHAN = 60;
/**叹号 ! */
const C_BANG = 33;
/**反斜杠 \ */
const C_BACKSLASH = 92;
/**和号 & */
const C_AMPERSAND = 38;
/**开括号 ( */
const C_OPEN_PAREN = 40;
/**开括号 ) */
const C_CLOSE_PAREN = 41;
/**冒号 : */
const C_COLON = 58;
/**闭单引号 ' */
const C_SINGLEQUOTE = 39;
/**双引号 " */
const C_DOUBLEQUOTE = 34;
/**等号 */
const C_EQUAL = 61;
/**波浪号 ~ */
const C_WAVES = 126;
/**美元 $ */
const C_DOLLAR = 36;

const reItemCheckbox = /^\[(\s|x|X)\]/;


// Some regexps used in inline parser:

const ESCAPABLE = common.ESCAPABLE;
const ESCAPED_CHAR = "\\\\" + ESCAPABLE;

const ENTITY = common.ENTITY;
const reHtmlTag = common.reHtmlTag;

const rePunctuation = new RegExp(
    /[!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u0AF0\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166D\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E42\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC9\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDF3C-\uDF3E]|\uD809[\uDC70-\uDC74]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]/
);

const reLinkTitle = new RegExp(
    '^(?:"(' +
    ESCAPED_CHAR +
    '|[^"\\x00])*"' +
    "|" +
    "'(" +
    ESCAPED_CHAR +
    "|[^'\\x00])*'" +
    "|" +
    "\\((" +
    ESCAPED_CHAR +
    "|[^()\\x00])*\\))"
);

const reLinkDestinationBraces = /^(?:<(?:[^<>\n\\\x00]|\\.)*>)/;

const reEscapable = new RegExp("^" + ESCAPABLE);

const reEntityHere = new RegExp("^" + ENTITY, "i");

const reTicks = /`+/;

const reTicksHere = /^`+/;

const reEllipses = /\.\.\./g;

const reDash = /--+/g;

const reEmailAutolink = /^<([a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)>/;

const reAutolink = /^<[A-Za-z][A-Za-z0-9.+-]{1,31}:[^<>\x00-\x20]*>/i;

const reSpnl = /^ *(?:\n *)?/;

const reWhitespaceChar = /^[ \t\n\x0b\x0c\x0d]/;

const reUnicodeWhitespaceChar = /^\s/;

const reFinalSpace = / *$/;

const reInitialSpace = /^ */;

const reSpaceAtEndOfLine = /^ *(?:\n|$)/;

const reLinkLabel = /^\[(?:[^\\\[\]]|\\.){0,1000}\]/;

// Matches a string of non-special characters.
const reMain = /^[^\n`\[\]\\!<&*_'"~$]+/m;

function text(s: string): VNode {
    var node = new VNode("text");
    node._literal = s;
    return node;
}

// normalize a reference in reference link (remove []s, trim,
// collapse internal space, unicode case fold.
// See commonmark/commonmark.js#168.
export function normalizeReference(string: string): string {
    return string
        .slice(1, string.length - 1)
        .trim()
        .replace(/[ \t\r\n]+/, " ")
};


function removeDelimitersBetween(bottom, top) {
    if (bottom.next !== top) {
        bottom.next = top;
        top.previous = bottom;
    }
};

type Res = {
    numdelims: number;
    can_open: boolean;
    can_close: boolean;
}

type Delimiters = {
    cc: number,
    numdelims: number,
    origdelims: number,
    node: VNode,
    previous: Delimiters,
    next: Delimiters,
    can_open: boolean,
    can_close: boolean
}

// The InlineParser object.
export default class InlineParser {

    subject: string;
    delimiters: Delimiters; // 分隔符
    brackets: any;
    pos: number;
    refmap: Map<string, { destination: string, title: string }>;
    options: { smart };
    constructor(options = { smart: '' }) {
        this.subject = '';
        this.delimiters = null; // used by handleDelim method # 用 handleDelim 方法
        this.brackets = null;
        this.pos = 0;
        this.refmap = new Map();
        this.options = options
    }


    // INLINE PARSER

    // These are methods of an InlineParser object, defined below.
    // An InlineParser keeps track of a subject (a string to be
    // parsed) and a position in that subject.
    //这些是InlineParser对象的方法，在下面定义。
    //一个InlineParser跟踪一个主题(一个要被
    // parse)和在该主题中的一个位置。


    // If re matches at current position in the subject, advance
    // 如果re在主题的当前位置匹配，则前进
    // position in subject and return the match; otherwise return null.
    // 定位主题并返回匹配;否则返回null。
    private match(re: RegExp): string {
        let m = re.exec(this.subject.slice(this.pos));
        if (m === null) {
            return null;
        } else {
            this.pos += m.index + m[0].length;
            return m[0];
        }
    }

    // Returns the code for the character at the current subject position, or -1
    // 返回当前主题位置的字符的代码，或-1
    // there are no more characters.
    // 没有更多的字符。
    public peek(): number {
        if (this.pos < this.subject.length) {
            return this.subject.charCodeAt(this.pos);
        } else {
            return -1;
        }
    }

    // Parse zero or more space characters, including at most one newline
    // 解析0个或多个空格字符，最多包含一个换行符
    public spnl(): boolean {
        this.match(reSpnl);
        return true;
    }

    // All of the parsers below try to match something at the current position
    // in the subject.  If they succeed in matching anything, they
    // return the inline matched, advancing the subject.

    // Attempt to parse backticks, adding either a backtick code span or a
    // literal sequence of backticks.
    public parseBackticks(block: VNode) {
        var ticks = this.match(reTicksHere);
        if (ticks === null) {
            return false;
        }
        var afterOpenTicks = this.pos;
        var matched;
        var node: VNode;
        var contents;
        while ((matched = this.match(reTicks)) !== null) {
            if (matched === ticks) {
                node = new VNode("code");
                contents = this.subject
                    .slice(afterOpenTicks, this.pos - ticks.length)
                    .replace(/\n/gm, " ");
                if (
                    contents.length > 0 &&
                    contents.match(/[^ ]/) !== null &&
                    contents[0] == " " &&
                    contents[contents.length - 1] == " "
                ) {
                    node._literal = contents.slice(1, contents.length - 1);
                } else {
                    node._literal = contents;
                }
                block.appendChild(node);
                return true;
            }
        }
        // If we got here, we didn't match a closing backtick sequence.
        this.pos = afterOpenTicks;
        block.appendChild(text(ticks));
        return true;
    }

    // Parse a backslash-escaped special character, adding either the escaped
    // character, a hard line break (if the backslash is followed by a newline),
    // or a literal backslash to the block's children.  Assumes current character
    // is a backslash.
    public parseBackslash(block: VNode) {
        var subj = this.subject;
        var node;
        this.pos += 1;
        if (this.peek() === C_NEWLINE) {
            this.pos += 1;
            node = new VNode("linebreak");
            block.appendChild(node);
        } else if (reEscapable.test(subj.charAt(this.pos))) {
            block.appendChild(text(subj.charAt(this.pos)));
            this.pos += 1;
        } else {
            block.appendChild(text("\\"));
        }
        return true;
    };

    // Attempt to parse an autolink (URL or email in pointy brackets).
    /**尝试解析autolink(尖括号中的URL或电子邮件)。 */
    public parseAutolink(block: VNode): boolean {
        let m: string, dest: string, node: VNode;
        if ((m = this.match(reEmailAutolink))) {
            dest = m.slice(1, m.length - 1);
            node = new VNode("link");
            node._info = { type: "autolink" }
            node._destination = normalizeURI("mailto:" + dest);
            node._title = "";
            node.appendChild(text(dest));
            block.appendChild(node);
            return true;
        } else if ((m = this.match(reAutolink))) {
            dest = m.slice(1, m.length - 1);
            node = new VNode("link");
            node._info = { type: "autolink" }
            node._destination = normalizeURI(dest);
            node._title = "";
            node.appendChild(text(dest));
            block.appendChild(node);
            return true;
        } else {
            return false;
        }
    }

    // Attempt to parse a raw HTML tag.
    /**尝试解析一个原始的HTML标记。 */
    public parseHtmlTag(block: VNode): boolean {
        let m = this.match(reHtmlTag);
        if (m === null) {
            return false;
        } else {
            let node = new VNode("html_inline");
            node._literal = m;
            block.appendChild(node);
            return true;
        }
    }


    // Scan a sequence of characters with code cc, and return information about
    // 用代码cc扫描字符序列，并返回关于的信息
    // the number of delimiters and whether they are positioned such that
    // 分隔符的数目以及它们是否被这样定位
    // they can open and/or close emphasis or strong emphasis.  A utility
    // 它们可以开启和/或关闭强调或强烈强调。一个实用程序
    // function for strong/emph parsing.
    // 用于 strong/emph 解析的函数。
    public scanDelims(cc: number) {
        let numdelims: number = 0;
        var char_before, char_after, cc_after;
        var startpos = this.pos;
        var left_flanking, right_flanking, can_open: boolean, can_close: boolean;
        let after_is_whitespace: boolean,
            after_is_punctuation: boolean,
            before_is_whitespace: boolean,
            before_is_punctuation: boolean;

        if (cc === C_SINGLEQUOTE || cc === C_DOUBLEQUOTE) {
            numdelims++;
            this.pos++;
        } else {
            while (this.peek() === cc) {
                numdelims++;
                this.pos++;
            }
        }

        if (numdelims === 0) {
            return null;
        }

        char_before = startpos === 0 ? "\n" : this.subject.charAt(startpos - 1);

        cc_after = this.peek();
        if (cc_after === -1) {
            char_after = "\n";
        } else {
            char_after = fromCodePoint(cc_after);
        }

        after_is_whitespace = reUnicodeWhitespaceChar.test(char_after);
        after_is_punctuation = rePunctuation.test(char_after);
        before_is_whitespace = reUnicodeWhitespaceChar.test(char_before);
        before_is_punctuation = rePunctuation.test(char_before);

        left_flanking =
            !after_is_whitespace &&
            (!after_is_punctuation ||
                before_is_whitespace ||
                before_is_punctuation);
        right_flanking =
            !before_is_whitespace &&
            (!before_is_punctuation || after_is_whitespace || after_is_punctuation);
        if (cc === C_UNDERSCORE) {
            can_open = left_flanking && (!right_flanking || before_is_punctuation);
            can_close = right_flanking && (!left_flanking || after_is_punctuation);
        } else if (cc === C_SINGLEQUOTE || cc === C_DOUBLEQUOTE) {
            can_open = left_flanking && !right_flanking;
            can_close = right_flanking;
        } else {
            can_open = left_flanking;
            can_close = right_flanking;
        }
        this.pos = startpos;
        return { numdelims: numdelims, can_open: can_open, can_close: can_close };
    }

    // Handle a delimiter marker for emphasis or a quote.
    // 处理用于强调或引号的分隔符标记。
    public handleDelim(cc: number, block: VNode) {
        let res: Res = this.scanDelims(cc);
        if (!res) {
            return false;
        }
        let numdelims = res.numdelims;
        let startpos = this.pos;
        let contents: string;

        this.pos += numdelims;
        if (cc === C_SINGLEQUOTE) {
            contents = "\u2019";
        } else if (cc === C_DOUBLEQUOTE) {
            contents = "\u201C";
        } else {
            contents = this.subject.slice(startpos, this.pos);
        }

        if (contents == String.fromCharCode(C_WAVES)) {
            this.pos -= numdelims;
            return false;
        }

        var node = text(contents);
        block.appendChild(node);

        // Add entry to stack for this opener
        if (
            (res.can_open || res.can_close) &&
            (this.options.smart || (cc !== C_SINGLEQUOTE && cc !== C_DOUBLEQUOTE))
        ) {
            this.delimiters = {
                cc: cc,
                numdelims: numdelims,
                origdelims: numdelims,
                node: node,
                previous: this.delimiters,
                next: null,
                can_open: res.can_open,
                can_close: res.can_close
            };
            if (this.delimiters.previous !== null) {
                this.delimiters.previous.next = this.delimiters;
            }
        }

        return true;
    }

    // Attempt to parse link title (sans quotes), returning the string
    // or null if no match.
    public parseLinkTitle() {
        var title = this.match(reLinkTitle);
        if (title === null) {
            return null;
        } else {
            // chop off quotes from title and unescape:
            return unescapeString(title.substr(1, title.length - 2));
        }
    }


    // Attempt to parse link destination, returning the string or
    // null if no match.
    /**尝试解析链接目的地，返回字符串或如果没有匹配则为空 */
    public parseLinkDestination() {
        var res = this.match(reLinkDestinationBraces);
        if (res === null) {
            if (this.peek() === C_LESSTHAN) {
                return null;
            }
            // TODO handrolled parser; res should be null or the string
            var savepos = this.pos;
            var openparens = 0;
            var c;
            while ((c = this.peek()) !== -1) {
                if (
                    c === C_BACKSLASH &&
                    reEscapable.test(this.subject.charAt(this.pos + 1))
                ) {
                    this.pos += 1;
                    if (this.peek() !== -1) {
                        this.pos += 1;
                    }
                } else if (c === C_OPEN_PAREN) {
                    this.pos += 1;
                    openparens += 1;
                } else if (c === C_CLOSE_PAREN) {
                    if (openparens < 1) {
                        break;
                    } else {
                        this.pos += 1;
                        openparens -= 1;
                    }
                } else if (reWhitespaceChar.exec(fromCodePoint(c)) !== null) {
                    break;
                } else {
                    this.pos += 1;
                }
            }
            if (this.pos === savepos && c !== C_CLOSE_PAREN) {
                return null;
            }
            if (openparens !== 0) {
                return null;
            }
            res = this.subject.substr(savepos, this.pos - savepos);
            return normalizeURI(unescapeString(res));
        } else {
            // chop off surrounding <..>:
            return normalizeURI(unescapeString(res.substr(1, res.length - 2)));
        }
    }

    // Attempt to parse a link label, returning number of characters parsed.
    /**尝试解析一个链接标签，返回解析的字符数。 */
    parseLinkLabel(): number {
        let m = this.match(reLinkLabel);
        if (m === null || m.length > 1001) {
            return 0;
        } else {
            return m.length;
        }
    }

    // Add open bracket to delimiter stack and add a text node to block's children.
    /**向分隔符堆栈添加左括号，并向块的子节点添加文本节点。 */
    public parseOpenBracket(block: VNode) {
        var startpos = this.pos;
        this.pos += 1;

        var node = text("[");
        block.appendChild(node);

        // Add entry to stack for this opener
        this.addBracket(node, startpos, false);
        return true;
    };

    // IF next character is [, and ! delimiter to delimiter stack and
    // add a text node to block's children.  Otherwise just add a text node.
    public parseBang(block: VNode) {
        var startpos = this.pos;
        this.pos += 1;
        if (this.peek() === C_OPEN_BRACKET) {
            this.pos += 1;

            var node = text("![");
            block.appendChild(node);

            // Add entry to stack for this opener
            this.addBracket(node, startpos + 1, true);
        } else {
            block.appendChild(text("!"));
        }
        return true;
    }

    // Try to match close bracket against an opening in the delimiter
    // stack.  Add either a link or image, or a plain [ character,
    // to block's children.  If there is a matching delimiter,
    // remove it from the delimiter stack.
    /**
     * 尝试将右括号与分隔符中的开口相匹配堆栈。
     * 添加一个链接或图像，或一个普通字符，阻止儿童。
     * 如果有匹配的分隔符，从分隔符堆栈中删除它。 
     * */
    public parseCloseBracket(block: VNode) {
        let startpos: number, is_image: boolean, dest: string, title: string,
            link_type: string = "link", matched = false, reflabel: string, opener;

        this.pos += 1;
        startpos = this.pos;

        // get last [ or ![
        opener = this.brackets;

        if (opener === null) {
            // no matched opener, just return a literal
            block.appendChild(text("]"));
            return true;
        }

        if (!opener.active) {
            // no matched opener, just return a literal
            block.appendChild(text("]"));
            // take opener off brackets stack
            this.removeBracket();
            return true;
        }

        // If we got here, open is a potential opener
        is_image = opener.image;

        // Check to see if we have a link/image

        var savepos = this.pos;

        // Inline link?
        if (this.peek() === C_OPEN_PAREN) {
            this.pos++;
            if (
                this.spnl() &&
                (dest = this.parseLinkDestination()) !== null &&
                this.spnl() &&
                // make sure there's a space before the title:
                ((reWhitespaceChar.test(this.subject.charAt(this.pos - 1)) &&
                    (title = this.parseLinkTitle())) ||
                    true) &&
                this.spnl() &&
                this.peek() === C_CLOSE_PAREN
            ) {
                this.pos += 1;
                matched = true;
            } else {
                this.pos = savepos;
            }
        }

        if (!matched) {
            // Next, see if there's a link label
            var beforelabel = this.pos;
            var n = this.parseLinkLabel();
            let isDeflink = false;
            if (n > 2) {
                reflabel = this.subject.slice(beforelabel, beforelabel + n);
                /**一个中括号时不生成节点 */
                if (beforelabel > 0 && this.subject.substring(0, beforelabel).match(/\[(?:[^\\\[\]]|\\.){0,1000}\]$/)) {
                    isDeflink = true;
                }
            } else if (!opener.bracketAfter) {
                // Empty or missing second label means to use the first label as the reference.
                // The reference must not contain a bracket. If we know there's a bracket, we don't even bother checking it.
                reflabel = this.subject.slice(opener.index, startpos);
                if (this.pos !== beforelabel && opener.index > 0 && this.subject.substring(0, opener.index).match(/\[(?:[^\\\[\]]|\\.){0,1000}\]$/)) {
                    isDeflink = true;
                }
            }
            if (n === 0) {
                // If shortcut reference link, rewind before spaces we skipped.
                this.pos = savepos;
            }

            if (reflabel && isDeflink) {
                // lookup rawlabel in refmap
                /**在refmap中查找rawlabel */
                if (this.refmap.has(normalizeReference(reflabel))) {
                    let link = this.refmap.get(normalizeReference(reflabel));
                    dest = link.destination;
                    title = link.title;
                }
                link_type = "deflink";
                matched = true;
            }
        }

        if (matched) {
            var node = new VNode(is_image ? "image" : "link");
            node._info = { type: link_type, destination: "" }

            if (reflabel)
                node._info.destination = normalizeReference(reflabel);
            node._destination = dest;
            node._title = title || "";

            var tmp, next;
            tmp = opener.node._next;
            while (tmp) {
                next = tmp._next;
                tmp.unlink();
                node.appendChild(tmp);
                tmp = next;
            }
            block.appendChild(node);
            this.processEmphasis(opener.previousDelimiter);
            this.removeBracket();
            opener.node.unlink();

            // We remove this bracket and processEmphasis will remove later delimiters.
            // Now, for a link, we also deactivate earlier link openers.
            // (no links in links)
            if (!is_image) {
                opener = this.brackets;
                while (opener !== null) {
                    if (!opener.image) {
                        opener.active = false; // deactivate this opener
                    }
                    opener = opener.previous;
                }
            }

            return true;
        } else {
            // no match

            this.removeBracket(); // remove this opener from stack
            this.pos = startpos;
            block.appendChild(text("]"));
            return true;
        }
    }

    public addBracket(node, index, image) {
        if (this.brackets !== null) {
            this.brackets.bracketAfter = true;
        }
        this.brackets = {
            node: node,
            previous: this.brackets,
            previousDelimiter: this.delimiters,
            index: index,
            image: image,
            active: true
        };
    }

    public removeBracket() {
        this.brackets = this.brackets.previous;
    }

    // Attempt to parse an entity.
    /**尝试解析一个实体。 */
    public parseEntity(block: VNode): boolean {
        let m: string;
        if ((m = this.match(reEntityHere))) {
            //block.appendChild(text(decodeHTML(m)));
            block.appendChild(text(m));
            return true;
        } else {
            return false;
        }
    }

    // Parse a run of ordinary characters, or a single character with
    // a special meaning in markdown, as a plain string.
    /**
     * 解析一系列普通字符，或单个字符markdown的特殊含义，
     * 作为普通字符串。 
     * */
    public parseString(block: VNode) {
        let m: string;
        if ((m = this.match(reMain))) {
            if (this.options.smart) {
                block.appendChild(
                    text(
                        m.replace(reEllipses, "\u2026").replace(reDash,
                            function (chars) {
                                let enCount = 0;
                                let emCount = 0;
                                if (chars.length % 3 === 0) {
                                    // If divisible by 3, use all em dashes
                                    emCount = chars.length / 3;
                                } else if (chars.length % 2 === 0) {
                                    // If divisible by 2, use all en dashes
                                    enCount = chars.length / 2;
                                } else if (chars.length % 3 === 2) {
                                    // If 2 extra dashes, use en dash for last 2; em dashes for rest
                                    enCount = 1;
                                    emCount = (chars.length - 2) / 3;
                                } else {
                                    // Use en dashes for last 4 hyphens; em dashes for rest
                                    enCount = 2;
                                    emCount = (chars.length - 4) / 3;
                                }
                                return (
                                    "\u2014".repeat(emCount) +
                                    "\u2013".repeat(enCount)
                                );
                            })
                    )
                );
            } else {
                block.appendChild(text(m));
            }
            return true;
        } else {
            return false;
        }
    }

    // Parse a newline.  If it was preceded by two spaces, return a hard
    // line break; otherwise a soft line break.
    public parseNewline(block: VNode) {
        this.pos += 1; // assume we're at a \n
        // check previous node for trailing spaces
        var lastc = block.lastChild;
        if (
            lastc &&
            lastc.type === "text" &&
            lastc._literal[lastc._literal.length - 1] === " "
        ) {
            var hardbreak = lastc._literal[lastc._literal.length - 2] === " ";
            lastc._literal = lastc._literal.replace(reFinalSpace, "");
            block.appendChild(new VNode(hardbreak ? "linebreak" : "softbreak"));
        } else {
            block.appendChild(new VNode("softbreak"));
        }
        this.match(reInitialSpace); // gobble leading spaces in next line
        return true;
    }

    // Attempt to parse a link reference, modifying refmap.
    // 尝试解析一个链接引用，修改refmap。
    public parseReference(s: string, refmap: Map<string, { destination: string, title: string }>) {
        this.subject = s;
        this.pos = 0;
        let rawlabel: string;
        let dest: string;
        let title: string;
        let matchChars: number;
        let startpos = this.pos;

        // label:
        matchChars = this.parseLinkLabel();
        if (matchChars === 0) {
            return 0;
        } else {
            rawlabel = this.subject.substr(0, matchChars);
        }

        // colon:
        if (this.peek() === C_COLON) {
            this.pos++;
        } else {
            this.pos = startpos;
            return 0;
        }

        //  link url
        this.spnl();

        dest = this.parseLinkDestination();
        if (dest === null) {
            this.pos = startpos;
            return 0;
        }

        var beforetitle = this.pos;
        this.spnl();
        if (this.pos !== beforetitle) {
            title = this.parseLinkTitle();
        }
        if (title === null) {
            title = "";
            // rewind before spaces
            this.pos = beforetitle;
        }

        // make sure we're at line end:
        var atLineEnd = true;
        if (this.match(reSpaceAtEndOfLine) === null) {
            if (title === "") {
                atLineEnd = false;
            } else {
                // the potential title we found is not at the line end,
                // but it could still be a legal link reference if we
                // discard the title
                title = "";
                // rewind before spaces
                this.pos = beforetitle;
                // and instead check if the link URL is at the line end
                atLineEnd = this.match(reSpaceAtEndOfLine) !== null;
            }
        }

        if (!atLineEnd) {
            this.pos = startpos;
            return 0;
        }

        var normlabel = normalizeReference(rawlabel);
        if (normlabel === "") {
            // label must contain non-whitespace characters
            this.pos = startpos;
            return 0;
        }

        if (!refmap.has(normlabel)) {
            refmap.set(normlabel, { destination: dest, title: title });
        }
        return this.pos - startpos;
    }

    // Parse the next inline element in subject, advancing subject position.
    // 解析subject中的下一个行内元素，推进主题位置。
    // On success, add the result to block's children and return true.
    // On failure, return false.
    public parseInline(block: VNode) {
        let res = false;
        let c = this.peek();
        if (c === -1) {
            return false;
        }
        switch (c) {
            case C_NEWLINE:
                res = this.parseNewline(block);
                break;
            case C_BACKSLASH:
                res = this.parseBackslash(block);
                break;
            case C_BACKTICK:
                res = this.parseBackticks(block);
                break;
            case C_DOLLAR:
            case C_WAVES:
            case C_ASTERISK:
            case C_UNDERSCORE:
                res = this.handleDelim(c, block);
                break;
            case C_SINGLEQUOTE:
            case C_DOUBLEQUOTE:
                res = this.options.smart && this.handleDelim(c, block);
                break;
            case C_OPEN_BRACKET:
                res = this.parseOpenBracket(block);
                break;
            case C_BANG:
                res = this.parseBang(block);
                break;
            case C_CLOSE_BRACKET:
                res = this.parseCloseBracket(block);
                break;
            case C_LESSTHAN:
                res = this.parseAutolink(block) || this.parseHtmlTag(block);
                break;
            case C_AMPERSAND:
                res = this.parseEntity(block);
                break;
            default:
                res = this.parseString(block);
                break;
        }
        if (!res) {
            this.pos += 1;
            block.appendChild(text(fromCodePoint(c)));
        }

        return true;
    }

    public processEmphasis(stack_bottom: Delimiters) {
        var opener, closer: Delimiters, old_closer;
        var opener_inl: VNode, closer_inl: VNode;
        var tempstack;
        var use_delims;
        var tmp, next;
        var opener_found;
        var openers_bottom = [[], [], []];
        var odd_match = false;

        for (var i = 0; i < 3; i++) {
            openers_bottom[i][C_UNDERSCORE] = stack_bottom;
            openers_bottom[i][C_ASTERISK] = stack_bottom;
            openers_bottom[i][C_SINGLEQUOTE] = stack_bottom;
            openers_bottom[i][C_DOUBLEQUOTE] = stack_bottom;
        }
        // find first closer above stack_bottom:
        closer = this.delimiters;
        while (closer !== null && closer.previous !== stack_bottom) {
            closer = closer.previous;
        }
        // move forward, looking for closers, and handling each
        while (closer !== null) {
            var closercc = closer.cc;
            if (!closer.can_close) {
                closer = closer.next;
            } else {
                // found emphasis closer. now look back for first matching opener:
                opener = closer.previous;
                opener_found = false;
                while (
                    opener !== null &&
                    opener !== stack_bottom &&
                    opener !== openers_bottom[closer.origdelims % 3][closercc]
                ) {
                    odd_match =
                        (closer.can_open || opener.can_close) &&
                        closer.origdelims % 3 !== 0 &&
                        (opener.origdelims + closer.origdelims) % 3 === 0;
                    if (opener.cc === closer.cc && opener.can_open && !odd_match) {
                        opener_found = true;
                        break;
                    }
                    opener = opener.previous;
                }
                old_closer = closer;

                if (closercc === C_ASTERISK || closercc === C_UNDERSCORE) {
                    if (!opener_found) {
                        closer = closer.next;
                    } else {
                        // calculate actual number of delimiters used from closer
                        use_delims =
                            closer.numdelims >= 2 && opener.numdelims >= 2 ? 2 : 1;

                        opener_inl = opener.node;
                        closer_inl = closer.node;

                        let art_mark = opener_inl._literal.length > closer_inl._literal.length ? closer_inl._literal : opener_inl._literal;
                        // remove used delimiters from stack elts and inlines
                        opener.numdelims -= use_delims;
                        closer.numdelims -= use_delims;
                        opener_inl._literal = opener_inl._literal.slice(
                            0,
                            opener_inl._literal.length - use_delims
                        );
                        closer_inl._literal = closer_inl._literal.slice(
                            0,
                            closer_inl._literal.length - use_delims
                        );

                        // build contents for new emph element
                        var emph = new VNode(use_delims === 1 ? "emph" : "strong")
                        emph.attrs.set("art-marker", art_mark)
                        tmp = opener_inl.next;
                        while (tmp && tmp !== closer_inl) {
                            next = tmp._next;
                            tmp.unlink();
                            emph.appendChild(tmp);

                            tmp = next;
                        }

                        opener_inl.insertAfter(emph);

                        // remove elts between opener and closer in delimiters stack
                        removeDelimitersBetween(opener, closer);

                        // if opener has 0 delims, remove it and the inline
                        if (opener.numdelims === 0) {
                            opener_inl.unlink();
                            this.removeDelimiter(opener);
                        }

                        if (closer.numdelims === 0) {
                            closer_inl.unlink();
                            tempstack = closer.next;
                            this.removeDelimiter(closer);
                            closer = tempstack;
                        }
                    }
                } else if (closercc === C_DOLLAR) {
                    if (!opener_found) {
                        closer = closer.next;
                    } else {
                        // calculate actual number of delimiters used from closer
                        // 计算从closer开始使用的分隔符的实际数目
                        use_delims =
                            closer.numdelims >= 2 && opener.numdelims >= 2 ? 2 : 1;

                        opener_inl = opener.node;
                        closer_inl = closer.node;

                        let art_mark = opener_inl._literal;
                        // remove used delimiters from stack elts and inlines
                        opener.numdelims -= use_delims;
                        closer.numdelims -= use_delims;
                        opener_inl._literal = opener_inl._literal.slice(
                            0,
                            opener_inl._literal.length - use_delims
                        );
                        closer_inl._literal = closer_inl._literal.slice(
                            0,
                            closer_inl._literal.length - use_delims
                        );
                        if (use_delims === 1) {
                            let math = new VNode("math");
                            tmp = opener_inl.next;
                            while (tmp && tmp !== closer_inl) {
                                next = tmp._next;
                                tmp.unlink();
                                math.appendChild(tmp);

                                tmp = next;
                            }

                            opener_inl.insertAfter(math);

                            // remove elts between opener and closer in delimiters stack
                            removeDelimitersBetween(opener, closer);

                            // if opener has 0 delims, remove it and the inline
                            if (opener.numdelims === 0) {
                                opener_inl.unlink();
                                this.removeDelimiter(opener);
                            }

                            if (closer.numdelims === 0) {
                                closer_inl.unlink();
                                tempstack = closer.next;
                                this.removeDelimiter(closer);
                                closer = tempstack;
                            }
                        }

                    }
                } else if (closercc === C_WAVES) {
                    if (!opener_found) {
                        closer = closer.next;
                    } else {
                        // calculate actual number of delimiters used from closer
                        use_delims =
                            closer.numdelims >= 2 && opener.numdelims >= 2 ? 2 : 1;

                        opener_inl = opener.node;
                        closer_inl = closer.node;

                        let art_mark = opener_inl._literal;
                        // remove used delimiters from stack elts and inlines
                        opener.numdelims -= use_delims;
                        closer.numdelims -= use_delims;
                        opener_inl._literal = opener_inl._literal.slice(
                            0,
                            opener_inl._literal.length - use_delims
                        );
                        closer_inl._literal = closer_inl._literal.slice(
                            0,
                            closer_inl._literal.length - use_delims
                        );

                        // build contents for new emph element
                        var emph = new VNode(use_delims === 1 ? "sub" : "delete")
                        emph.attrs.set("art-marker", art_mark)
                        tmp = opener_inl.next;
                        while (tmp && tmp !== closer_inl) {
                            next = tmp._next;
                            tmp.unlink();
                            emph.appendChild(tmp);

                            tmp = next;
                        }

                        opener_inl.insertAfter(emph);

                        // remove elts between opener and closer in delimiters stack
                        removeDelimitersBetween(opener, closer);

                        // if opener has 0 delims, remove it and the inline
                        if (opener.numdelims === 0) {
                            opener_inl.unlink();
                            this.removeDelimiter(opener);
                        }

                        if (closer.numdelims === 0) {
                            closer_inl.unlink();
                            tempstack = closer.next;
                            this.removeDelimiter(closer);
                            closer = tempstack;
                        }
                    }
                } else if (closercc === C_SINGLEQUOTE) {
                    closer.node._literal = "\u2019";
                    if (opener_found) {
                        opener.node._literal = "\u2018";
                    }
                    closer = closer.next;
                } else if (closercc === C_DOUBLEQUOTE) {
                    closer.node._literal = "\u201D";
                    if (opener_found) {
                        opener.node.literal = "\u201C";
                    }
                    closer = closer.next;
                }
                if (!opener_found) {
                    // Set lower bound for future searches for openers:
                    openers_bottom[old_closer.origdelims % 3][closercc] =
                        old_closer.previous;
                    if (!old_closer.can_open) {
                        // We can remove a closer that can't be an opener,
                        // once we've seen there's no matching opener:
                        this.removeDelimiter(old_closer);
                    }
                }
            }
        }

        // remove all delimiters
        while (this.delimiters !== null && this.delimiters !== stack_bottom) {
            this.removeDelimiter(this.delimiters);
        }
    }


    public removeDelimiter(delim) {
        if (delim.previous !== null) {
            delim.previous.next = delim.next;
        }
        if (delim.next === null) {
            // top of stack
            this.delimiters = delim.previous;
        } else {
            delim.next.previous = delim.previous;
        }
    }

    // Parse string content in block into inline children,
    // 将块中的字符串内容解析为内联子程序，
    // using refmap to resolve references.
    // 使用refmap来解析引用。
    public parseInlines(block: VNode) {
        let match;
        if (block.parent && block.parent.type === "item" && (match = block._string_content.match(reItemCheckbox))) {
            let item_checkbox = new VNode("item_checkbox");
            item_checkbox.attrs.set("type", "checkbox");
            item_checkbox.attrs.set("disabled", "disabled");
            if (match[1] !== " ") {
                item_checkbox.attrs.set("checked", "checked");
            }
            block.insertBefore(item_checkbox);
            block._string_content = block._string_content.substring(3);
        }

        this.subject = block._string_content.trim(); //  trim()方法用于删除字符串的头尾空白符，空白符包括：空格、制表符 tab、换行符等其他空白符等。
        // this.subject = block._string_content;
        this.pos = 0;
        this.delimiters = null;
        this.brackets = null;
        while (this.parseInline(block));
        block._string_content = null; // allow raw string to be garbage collected # 允许原始字符串被垃圾收集
        this.processEmphasis(null);
    }


    public parse(block: VNode) {
        this.parseInlines(block);
    }
}
