import ArtText from "@/artText";
import { Art } from "@/core";
import Editor from "@/editor";
import EventCenter from "@/eventCenter";
import StatusBar from ".";
import Message from "../message";

export class SwitchRenderButton {
  artText: ArtText;
  spanElement: HTMLSpanElement;
  title: string;
  abbrNames: string[];
  renderNames: string[];
  constructor(artText: ArtText) {
    this.artText = artText;
    this.title = "默认";

    this.spanElement = null;
    this.abbrNames = [];
    this.renderNames = [];

    const _this = this;
    this.artText
      .get<EventCenter>("$eventCenter")
      .on(
        "@switchRenderButton-addRender",
        (abbrNames: any, renderName: any) => {
          _this.addRender(abbrNames, renderName);
        }
      );
  }

  public addRender(abbrNames: string, renderName: string): void {
    this.abbrNames.push(abbrNames);
    this.renderNames.push(renderName);
  }

  public click(): void {
    let index: number = this.abbrNames.indexOf(this.title);
    if (index > -1) {
      index++;
      if (index == this.abbrNames.length) {
        index = 0;
      }
      this.title = this.abbrNames[index];
      this.spanElement.title = this.abbrNames[index];
      try {
        this.artText
          .get<Editor>("$editor")
          .switchRender(this.renderNames[index]);
      } catch (err) {
        console.error(err);
        this.artText.get<Message>("message").create("切换渲染器失败", "error");
      }
    }
  }
}

export let switchRenderButtonExport = {
  install: (Art, options) => {
    options["container"].bind(
      "switchRenderButton",
      SwitchRenderButton,
      [{ get: "art" }],
      true
    );
  },
  created: function (art: Art, options) {
    let switchRenderBotton = art.get<SwitchRenderButton>("switchRenderButton");

    if (switchRenderBotton.abbrNames.length > 0)
      switchRenderBotton.title = switchRenderBotton.abbrNames[0];

    const chevronBackOutlineSvg =
      '<svg style="fill: currentColor;width: 16px" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1666"><path d="M128 522.666667c17.066667 0 32-14.933333 32-32v-170.666667c0-6.4 4.266667-10.666667 10.666667-10.666667h652.8l-83.2 83.2c-12.8 12.8-12.8 34.133333 0 46.933334 6.4 6.4 14.933333 10.666667 23.466666 10.666666s17.066667-4.266667 23.466667-10.666666l145.066667-145.066667c12.8-12.8 12.8-34.133333 0-46.933333l-145.066667-145.066667c-12.8-12.8-34.133333-12.8-46.933333 0-12.8 12.8-12.8 34.133333 0 46.933333l93.866666 93.866667H170.666667c-40.533333 0-74.666667 34.133333-74.666667 74.666667v170.666666c0 19.2 14.933333 34.133333 32 34.133334zM906.666667 501.333333c-17.066667 0-32 14.933333-32 32v170.666667c0 6.4-4.266667 10.666667-10.666667 10.666667H211.2l83.2-83.2c12.8-12.8 12.8-34.133333 0-46.933334-12.8-12.8-34.133333-12.8-46.933333 0l-145.066667 145.066667c-12.8 12.8-12.8 34.133333 0 46.933333l145.066667 145.066667c6.4 6.4 14.933333 10.666667 23.466666 10.666667s17.066667-4.266667 23.466667-10.666667c12.8-12.8 12.8-34.133333 0-46.933333l-93.866667-93.866667h663.466667c40.533333 0 74.666667-34.133333 74.666667-74.666667v-170.666666c0-19.2-12.8-34.133333-32-34.133334z" p-id="1667"></path></svg>';
    const dom = document.createElement("span");
    switchRenderBotton.spanElement = dom;
    dom.title = switchRenderBotton.title;
    dom.style.display = "flex";
    dom.innerHTML = chevronBackOutlineSvg;
    art.get<StatusBar>("statusBar").addButton({
      dom: dom,
      float: "left",
      onClick: () => {
        switchRenderBotton.click();
      },
    });
  },
};

export let fullScreenExport = {
  created(art: ArtText, options) {
    const fullScreenShrink =
      '<svg class="icon" style="width: 1em;height: 1em;vertical-align: middle;fill: currentColor;overflow: hidden;" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1237"><path d="M313.6 358.4H177.066667c-17.066667 0-32 14.933333-32 32s14.933333 32 32 32h213.333333c4.266667 0 8.533333 0 10.666667-2.133333 8.533333-4.266667 14.933333-8.533333 17.066666-17.066667 2.133333-4.266667 2.133333-8.533333 2.133334-10.666667v-213.333333c0-17.066667-14.933333-32-32-32s-32 14.933333-32 32v136.533333L172.8 125.866667c-12.8-12.8-32-12.8-44.8 0-12.8 12.8-12.8 32 0 44.8l185.6 187.733333zM695.466667 650.666667H832c17.066667 0 32-14.933333 32-32s-14.933333-32-32-32H618.666667c-4.266667 0-8.533333 0-10.666667 2.133333-8.533333 4.266667-14.933333 8.533333-17.066667 17.066667-2.133333 4.266667-2.133333 8.533333-2.133333 10.666666v213.333334c0 17.066667 14.933333 32 32 32s32-14.933333 32-32v-136.533334l200.533333 200.533334c6.4 6.4 14.933333 8.533333 23.466667 8.533333s17.066667-2.133333 23.466667-8.533333c12.8-12.8 12.8-32 0-44.8l-204.8-198.4zM435.2 605.866667c-4.266667-8.533333-8.533333-14.933333-17.066667-17.066667-4.266667-2.133333-8.533333-2.133333-10.666666-2.133333H192c-17.066667 0-32 14.933333-32 32s14.933333 32 32 32h136.533333L128 851.2c-12.8 12.8-12.8 32 0 44.8 6.4 6.4 14.933333 8.533333 23.466667 8.533333s17.066667-2.133333 23.466666-8.533333l200.533334-200.533333V832c0 17.066667 14.933333 32 32 32s32-14.933333 32-32V618.666667c-2.133333-4.266667-2.133333-8.533333-4.266667-12.8zM603.733333 403.2c4.266667 8.533333 8.533333 14.933333 17.066667 17.066667 4.266667 2.133333 8.533333 2.133333 10.666667 2.133333h213.333333c17.066667 0 32-14.933333 32-32s-14.933333-32-32-32h-136.533333L896 170.666667c12.8-12.8 12.8-32 0-44.8-12.8-12.8-32-12.8-44.8 0l-187.733333 187.733333V177.066667c0-17.066667-14.933333-32-32-32s-32 14.933333-32 32v213.333333c2.133333 4.266667 2.133333 8.533333 4.266666 12.8z" p-id="1238"></path></svg>';
    const fullScreenExpand =
      '<svg class="icon" style="width: 1em;height: 1em;vertical-align: middle;fill: currentColor;overflow: hidden;" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1270"><path d="M149.333333 394.666667c17.066667 0 32-14.933333 32-32v-136.533334l187.733334 187.733334c6.4 6.4 14.933333 8.533333 23.466666 8.533333s17.066667-2.133333 23.466667-8.533333c12.8-12.8 12.8-32 0-44.8l-187.733333-187.733334H362.666667c17.066667 0 32-14.933333 32-32s-14.933333-32-32-32H149.333333c-4.266667 0-8.533333 0-10.666666 2.133334-8.533333 4.266667-14.933333 10.666667-19.2 17.066666-2.133333 4.266667-2.133333 8.533333-2.133334 12.8v213.333334c0 17.066667 14.933333 32 32 32zM874.666667 629.333333c-17.066667 0-32 14.933333-32 32v136.533334L642.133333 597.333333c-12.8-12.8-32-12.8-44.8 0s-12.8 32 0 44.8l200.533334 200.533334H661.333333c-17.066667 0-32 14.933333-32 32s14.933333 32 32 32h213.333334c4.266667 0 8.533333 0 10.666666-2.133334 8.533333-4.266667 14.933333-8.533333 17.066667-17.066666 2.133333-4.266667 2.133333-8.533333 2.133333-10.666667V661.333333c2.133333-17.066667-12.8-32-29.866666-32zM381.866667 595.2l-200.533334 200.533333V661.333333c0-17.066667-14.933333-32-32-32s-32 14.933333-32 32v213.333334c0 4.266667 0 8.533333 2.133334 10.666666 4.266667 8.533333 8.533333 14.933333 17.066666 17.066667 4.266667 2.133333 8.533333 2.133333 10.666667 2.133333h213.333333c17.066667 0 32-14.933333 32-32s-14.933333-32-32-32h-136.533333l200.533333-200.533333c12.8-12.8 12.8-32 0-44.8s-29.866667-10.666667-42.666666 0zM904.533333 138.666667c0-2.133333 0-2.133333 0 0-4.266667-8.533333-10.666667-14.933333-17.066666-17.066667-4.266667-2.133333-8.533333-2.133333-10.666667-2.133333H661.333333c-17.066667 0-32 14.933333-32 32s14.933333 32 32 32h136.533334l-187.733334 187.733333c-12.8 12.8-12.8 32 0 44.8 6.4 6.4 14.933333 8.533333 23.466667 8.533333s17.066667-2.133333 23.466667-8.533333l187.733333-187.733333V362.666667c0 17.066667 14.933333 32 32 32s32-14.933333 32-32V149.333333c-2.133333-4.266667-2.133333-8.533333-4.266667-10.666666z" p-id="1271"></path></svg>';

    const dom = document.createElement("span");
    dom.title = "全屏";
    dom.style.display = "flex";
    dom.innerHTML = fullScreenExpand;
    let status = false;
    function changeScreen() {
        status = !status;
        if (status) {
            dom.title = "缩小";
            dom.innerHTML  = fullScreenShrink;
            art.dom.classList.add("art-body--full-screen");
        } else {
            dom.title = "全屏";
            dom.innerHTML = fullScreenExpand;
            art.dom.classList.remove("art-body--full-screen");
        }
    }
    art.get<StatusBar>("statusBar").addButton({
      dom: dom,
      float: "left",
      onClick: changeScreen,
    });
  },
};
