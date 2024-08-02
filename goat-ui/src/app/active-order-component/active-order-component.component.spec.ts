import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActiveOrderComponentComponent } from './active-order-component.component';

describe('ActiveOrderComponentComponent', () => {
  let component: ActiveOrderComponentComponent;
  let fixture: ComponentFixture<ActiveOrderComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActiveOrderComponentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ActiveOrderComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
