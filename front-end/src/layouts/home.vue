<script lang="ts" setup></script>

<template>
	<div text="center gray-700 dark:gray-200">
		<a class="skip-link" href="#main-content">Skip to content</a>
		<TheHeader />
		<main id="main-content" tabindex="-1">
			<RouterView />
		</main>
		<TheFooter />
		<!--    <div mt-5 mx-auto opacity-50 text-center text-sm>
      [Home Layout]
    </div> -->
	</div>
</template>
