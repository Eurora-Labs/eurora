<script lang="ts">
	import { Menubar as MenubarPrimitive } from 'bits-ui';
	import { cn } from '@eurora/ui/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: MenubarPrimitive.SubContentProps = $props();
</script>

<MenubarPrimitive.SubContent
	bind:ref
	class={cn(
		'z-50 min-w-max rounded-md border bg-popover p-1 text-popover-foreground shadow-lg focus:outline-none',
		className
	)}
	{...restProps}
/>
