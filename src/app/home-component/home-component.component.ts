import { Component} from '@angular/core';
import { GenderBarComponent } from "../gender-bar/gender-bar.component";
import { CoreBarComponent } from "../core-bar/core-bar.component";
import { BottomBarComponent } from "../bottom-bar/bottom-bar.component";
import { NAvBarComponent } from "../nav-bar/nav-bar.component";
import { LeftNavBarComponent } from "../left-nav-bar/left-nav-bar.component";
import { PlaceBarComponent } from "../place-bar/place-bar.component";
import { GridAlbumAreaComponent } from "../grid-album-area/grid-album-area.component";

@Component({
  selector: 'app-home-component',
  imports: [GenderBarComponent, CoreBarComponent, BottomBarComponent, NAvBarComponent, LeftNavBarComponent, PlaceBarComponent, GridAlbumAreaComponent],
  templateUrl: './home-component.component.html',
  styleUrl: './home-component.component.css'
})
export class HomeComponentComponent {
contexto: string = "Home";
  
}
