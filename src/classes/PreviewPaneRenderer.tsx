import {UnySpotLightSearchResultItem} from "./UnySpotLightSearchResultItem";
import {h} from "@stencil/core";

export class PreviewPaneRenderer {
    public static render(item: UnySpotLightSearchResultItem) {
        return (
            <div class="spotlight-search__preview-pane">
                <div class="spotlight-search__preview-pane-content">
                    <div class="spotlight-search__preview-pane-inner-content">
                        <img src="http://localhost:3033/text-file.svg" alt="" />
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