import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BuildingPanelComponent } from './building-panel.component';
import { Building } from '../../models/building.model';
import { provideAnimations } from '@angular/platform-browser/animations';
import { vi } from 'vitest';

const MOCK_BUILDING: Building = {
  id: 'test-tower',
  name: 'Test Tower',
  address: '123 Test St, New York, NY 10001',
  floors: 50,
  yearBuilt: 2000,
  owner: 'Test Corp',
  description: 'A test building used for unit testing.',
  geocode: { lat: 40.7128, lng: -74.006 }
};

describe('BuildingPanelComponent', () => {
  let component: BuildingPanelComponent;
  let fixture: ComponentFixture<BuildingPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuildingPanelComponent],
      providers: [provideAnimations()]
    }).compileComponents();

    fixture = TestBed.createComponent(BuildingPanelComponent);
    component = fixture.componentInstance;
    component.building = MOCK_BUILDING;
    fixture.detectChanges();
  });

  it('should display the building name in the toolbar', () => {
    const toolbar: HTMLElement = fixture.nativeElement.querySelector('mat-toolbar');
    expect(toolbar.textContent).toContain('Test Tower');
  });

  it('should display the address', () => {
    expect(fixture.nativeElement.textContent).toContain('123 Test St, New York, NY 10001');
  });

  it('should display the floor count', () => {
    expect(fixture.nativeElement.textContent).toContain('50');
  });

  it('should display the year built', () => {
    expect(fixture.nativeElement.textContent).toContain('2000');
  });

  it('should display the owner', () => {
    expect(fixture.nativeElement.textContent).toContain('Test Corp');
  });

  it('should display the geocode latitude and longitude', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('40.7128');
    expect(text).toContain('-74.006');
  });

  it('should display the description', () => {
    expect(fixture.nativeElement.textContent).toContain('A test building used for unit testing.');
  });

  it('should emit closed when the close button is clicked', () => {
    const emitSpy = vi.spyOn(component.closed, 'emit');
    const closeBtn: HTMLButtonElement = fixture.nativeElement.querySelector('[aria-label="Close panel"]');
    closeBtn.click();
    expect(emitSpy).toHaveBeenCalled();
  });
});
