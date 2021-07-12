export class SpotLightSearchResultItem {

  image: string;

  title: string;

  description: string;

  action: any;

  isActive: boolean = false;

  constructor(title: string, description: string, image: string, action: any) {
    this.title       = title;
    this.description = description;
    this.image       = image;
    this.action      = action;
    this.isActive    = false;
  }

  getCssClasses(): string {
    const classes = ['spotlight-search__item'];

    if (this.isActive) {
      classes.push('spotlight-search__item--active');
    }

    return classes.join(' ');
  }
}
