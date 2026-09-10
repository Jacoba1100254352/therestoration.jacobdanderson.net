<template>
	<main id="main-content" tabindex="-1" p="x4 y10" text="center teal-700 dark:gray-200">
		<div text-4xl aria-hidden="true">
			<div i-carbon-warning inline-block />
		</div>
		<RouterView />
		<p>The page may have moved or the address may be incorrect.</p>
		<RouterLink to="/" class="return-home">Return home</RouterLink>
	</main>
</template>

<style scoped>
.return-home {
	display: inline-block;
	margin-top: 1rem;
	color: #2a6496;
	text-decoration: underline;
}
</style>
