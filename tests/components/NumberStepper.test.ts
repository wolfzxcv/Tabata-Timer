import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import NumberStepper from '../../src/components/NumberStepper.vue';

describe('NumberStepper', () => {
  it('increments and decrements within bounds', async () => {
    const wrapper = mount(NumberStepper, {
      props: {
        label: 'WORK',
        modelValue: 20,
        min: 5,
        max: 300,
      },
    });

    await wrapper.get('[aria-label="Increase WORK"]').trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([21]);

    await wrapper.setProps({ modelValue: 5 });
    expect(wrapper.get('[aria-label="Decrease WORK"]').attributes('disabled')).toBeDefined();
  });
});
