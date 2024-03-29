import {SpotLightSearchResultItem} from "./SpotLightSearchResultItem";
import {h} from "@stencil/core";

export class PreviewPaneRenderer {
    public static render(item: SpotLightSearchResultItem) {
        return (
            <div class="spotlight-search__preview-pane">
                <div class="spotlight-search__preview-pane-content">
                    <div class="spotlight-search__preview-pane-inner-content">
                        {item.image && <img src={item.image} alt=""/>}
                        <h4>{item.title}</h4>
                        <h5>The subtitle</h5>
                        <div class="attributes">
                            <table>
                                <tr>
                                    <td class="attribute__label">Label</td>
                                    <td class="attribute__value">Value</td>
                                </tr>
                                <tr>
                                    <td class="attribute__label">Label</td>
                                    <td class="attribute__value">Value</td>
                                </tr>
                                <tr>
                                    <td class="attribute__label">Label</td>
                                    <td class="attribute__value">Value</td>
                                </tr>
                                <tr>
                                    <td class="attribute__label">Label</td>
                                    <td class="attribute__value">Value</td>
                                </tr>
                                <tr>
                                    <td class="attribute__label">Label</td>
                                    <td class="attribute__value">Value</td>
                                </tr>
                                <tr>
                                    <td class="attribute__label">Label</td>
                                    <td class="attribute__value">Value</td>
                                </tr>
                                <tr>
                                    <td class="attribute__label">Label</td>
                                    <td class="attribute__value">Value</td>
                                </tr>
                                <tr>
                                    <td class="attribute__label">Label</td>
                                    <td class="attribute__value">Value</td>
                                </tr>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
